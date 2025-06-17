#!/usr/bin/env python3
"""
Yellow Claude Orchestra - エージェントクライアント
各エージェントが通信システムに接続するためのクライアントライブラリ
"""

import json
import os
import time
import threading
from pathlib import Path
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime

from .message_hub import MessageHub


class AgentClient:
    """エージェントが通信システムに接続するためのクライアント"""
    
    def __init__(self, agent_id: str, agent_type: str, communication_dir: str, capabilities: List[str] = None):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.capabilities = capabilities or []
        
        self.hub = MessageHub(communication_dir)
        self.hub.register_agent(agent_id, agent_type, capabilities)
        
        # メッセージハンドラー
        self.message_handlers: Dict[str, Callable] = {}
        self.running = False
        self.polling_thread = None
        self.polling_interval = 1.0  # 秒
    
    def register_handler(self, message_type: str, handler: Callable[[Dict], Any]):
        """メッセージタイプに対するハンドラーを登録"""
        self.message_handlers[message_type] = handler
    
    def send_message(self, to_agent: str, message_type: str, content: Any, priority: str = "normal") -> str:
        """他のエージェントにメッセージを送信"""
        return self.hub.send_message(self.agent_id, to_agent, message_type, content, priority)
    
    def broadcast_message(self, message_type: str, content: Any, exclude_agents: List[str] = None) -> List[str]:
        """全エージェントにブロードキャスト"""
        return self.hub.broadcast_message(self.agent_id, message_type, content, exclude_agents)
    
    def get_active_agents(self) -> Dict[str, Dict]:
        """アクティブなエージェントのリストを取得"""
        agents = self.hub.get_active_agents()
        # 自分自身を除外
        return {aid: info for aid, info in agents.items() if aid != self.agent_id}
    
    def share_data(self, data_key: str, data: Any, ttl_seconds: Optional[int] = None):
        """データを共有"""
        self.hub.share_data(self.agent_id, data_key, data, ttl_seconds)
    
    def get_shared_data(self, data_key: str) -> Optional[Any]:
        """共有データを取得"""
        return self.hub.get_shared_data(data_key)
    
    def update_status(self, status: str, capabilities: List[str] = None):
        """自分のステータスを更新"""
        if capabilities:
            self.capabilities = capabilities
        self.hub.update_agent_status(self.agent_id, status, self.capabilities)
    
    def start_polling(self, interval: float = 1.0):
        """メッセージポーリングを開始"""
        self.polling_interval = interval
        self.running = True
        self.polling_thread = threading.Thread(target=self._poll_messages, daemon=True)
        self.polling_thread.start()
    
    def stop_polling(self):
        """メッセージポーリングを停止"""
        self.running = False
        if self.polling_thread:
            self.polling_thread.join()
    
    def process_messages_once(self):
        """メッセージを一度だけ処理"""
        messages = self.hub.get_unread_messages(self.agent_id)
        
        for message in messages:
            self._process_message(message)
        
        # メッセージを既読にマーク
        if messages:
            self.hub.get_messages(self.agent_id, mark_as_read=True)
    
    def _poll_messages(self):
        """メッセージをポーリング（バックグラウンドスレッド）"""
        while self.running:
            try:
                self.process_messages_once()
                time.sleep(self.polling_interval)
            except Exception as e:
                print(f"Error in message polling for {self.agent_id}: {e}")
                time.sleep(self.polling_interval)
    
    def _process_message(self, message: Dict):
        """個別メッセージを処理"""
        message_type = message.get('type')
        
        if message_type in self.message_handlers:
            try:
                response = self.message_handlers[message_type](message)
                
                # レスポンスがある場合は送信者に返信
                if response is not None:
                    self.send_message(
                        message['from'], 
                        f"{message_type}_response", 
                        response
                    )
            except Exception as e:
                print(f"Error processing message {message['id']}: {e}")
                # エラーレスポンスを送信
                error_response = {
                    'error': str(e),
                    'original_message_id': message['id']
                }
                self.send_message(
                    message['from'],
                    f"{message_type}_error",
                    error_response
                )
        else:
            print(f"No handler for message type '{message_type}' in agent {self.agent_id}")
    
    def request_response(self, to_agent: str, request_type: str, content: Any, timeout: float = 30.0) -> Optional[Any]:
        """リクエスト-レスポンス形式の通信"""
        request_id = f"{int(time.time() * 1000)}_{self.agent_id}"
        
        # リクエストにIDを追加
        request_content = {
            'request_id': request_id,
            'content': content
        }
        
        # リクエスト送信
        self.send_message(to_agent, request_type, request_content, priority="high")
        
        # レスポンスを待機
        start_time = time.time()
        response_type = f"{request_type}_response"
        
        while time.time() - start_time < timeout:
            messages = self.hub.get_messages(self.agent_id, mark_as_read=False)
            
            for message in messages:
                if (message['type'] == response_type and 
                    message['from'] == to_agent and
                    message.get('content', {}).get('request_id') == request_id):
                    
                    # このメッセージを既読にマーク
                    self.hub.get_messages(self.agent_id, mark_as_read=True)
                    return message['content'].get('content')
            
            time.sleep(0.1)
        
        return None  # タイムアウト
    
    def create_collaboration_session(self, session_id: str, participants: List[str], purpose: str) -> bool:
        """コラボレーションセッションを作成"""
        session_data = {
            'session_id': session_id,
            'creator': self.agent_id,
            'participants': participants,
            'purpose': purpose,
            'created_at': datetime.now().isoformat(),
            'status': 'active'
        }
        
        self.share_data(f"collaboration_session_{session_id}", session_data)
        
        # 参加者に通知
        for participant in participants:
            if participant != self.agent_id:
                self.send_message(
                    participant,
                    "collaboration_invite",
                    {
                        'session_id': session_id,
                        'purpose': purpose,
                        'creator': self.agent_id
                    }
                )
        
        return True
    
    def join_collaboration_session(self, session_id: str) -> Optional[Dict]:
        """コラボレーションセッションに参加"""
        session_data = self.get_shared_data(f"collaboration_session_{session_id}")
        
        if session_data and session_data['status'] == 'active':
            # セッションに参加していることを通知
            self.broadcast_message(
                "collaboration_join",
                {
                    'session_id': session_id,
                    'agent_id': self.agent_id
                }
            )
            return session_data
        
        return None
    
    def __enter__(self):
        """Context manager entry"""
        self.start_polling()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.stop_polling()
        self.update_status("inactive")


# 便利な装飾器
def message_handler(message_type: str):
    """メッセージハンドラーを登録するための装飾器"""
    def decorator(func):
        func._message_type = message_type
        return func
    return decorator


def auto_register_handlers(client: AgentClient, handler_object):
    """オブジェクトのメソッドから自動的にハンドラーを登録"""
    for attr_name in dir(handler_object):
        attr = getattr(handler_object, attr_name)
        if hasattr(attr, '_message_type') and callable(attr):
            client.register_handler(attr._message_type, attr)


# 使用例
if __name__ == "__main__":
    # テスト用の簡単なエージェント
    class TestAgent:
        def __init__(self, agent_id: str):
            self.client = AgentClient(
                agent_id=agent_id,
                agent_type="test",
                communication_dir="./communication",
                capabilities=["test", "echo"]
            )
            auto_register_handlers(self.client, self)
        
        @message_handler("echo")
        def handle_echo(self, message):
            content = message['content']
            return f"Echo from {self.client.agent_id}: {content}"
        
        @message_handler("status")
        def handle_status(self, message):
            return {
                'agent_id': self.client.agent_id,
                'status': 'active',
                'capabilities': self.client.capabilities
            }
        
        def run(self):
            with self.client:
                print(f"Test agent {self.client.agent_id} started")
                try:
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    print(f"Test agent {self.client.agent_id} stopped")
    
    import sys
    if len(sys.argv) > 1:
        agent = TestAgent(sys.argv[1])
        agent.run()
    else:
        print("Usage: python agent_client.py <agent_id>")