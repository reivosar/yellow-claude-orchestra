#!/usr/bin/env python3
"""
Yellow Claude Orchestra - メッセージングハブ
エージェント間通信システムの中核
"""

import json
import os
import time
import threading
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import queue
import fcntl


class MessageHub:
    """エージェント間通信を管理するメッセージハブ"""
    
    def __init__(self, communication_dir: str):
        self.communication_dir = Path(communication_dir)
        self.messages_dir = self.communication_dir / "messages"
        self.shared_dir = self.communication_dir / "shared"
        
        # ディレクトリの作成
        self.messages_dir.mkdir(parents=True, exist_ok=True)
        self.shared_dir.mkdir(parents=True, exist_ok=True)
        
        # メッセージキューとロック
        self.message_queue = queue.Queue()
        self.agents = {}
        self.running = False
    
    def register_agent(self, agent_id: str, agent_type: str, capabilities: List[str] = None):
        """エージェントを登録"""
        self.agents[agent_id] = {
            'type': agent_type,
            'capabilities': capabilities or [],
            'last_seen': datetime.now().isoformat(),
            'status': 'active'
        }
        
        # エージェント用メッセージボックスの作成
        agent_inbox = self.messages_dir / f"{agent_id}_inbox.json"
        if not agent_inbox.exists():
            self._write_json_file(agent_inbox, [])
        
        self._log_system_event(f"Agent {agent_id} registered with type {agent_type}")
    
    def send_message(self, from_agent: str, to_agent: str, message_type: str, content: Any, priority: str = "normal"):
        """メッセージを送信"""
        message = {
            'id': f"{int(time.time() * 1000)}_{from_agent}_{to_agent}",
            'timestamp': datetime.now().isoformat(),
            'from': from_agent,
            'to': to_agent,
            'type': message_type,
            'content': content,
            'priority': priority,
            'status': 'pending'
        }
        
        # 受信者のinboxに追加
        inbox_file = self.messages_dir / f"{to_agent}_inbox.json"
        self._append_to_inbox(inbox_file, message)
        
        # システムログに記録
        self._log_system_event(f"Message sent: {from_agent} -> {to_agent} ({message_type})")
        
        return message['id']
    
    def broadcast_message(self, from_agent: str, message_type: str, content: Any, exclude_agents: List[str] = None):
        """全エージェントにブロードキャスト"""
        exclude_agents = exclude_agents or []
        message_ids = []
        
        for agent_id in self.agents.keys():
            if agent_id != from_agent and agent_id not in exclude_agents:
                msg_id = self.send_message(from_agent, agent_id, message_type, content, priority="broadcast")
                message_ids.append(msg_id)
        
        return message_ids
    
    def get_messages(self, agent_id: str, mark_as_read: bool = True) -> List[Dict]:
        """エージェントのメッセージを取得"""
        inbox_file = self.messages_dir / f"{agent_id}_inbox.json"
        
        if not inbox_file.exists():
            return []
        
        messages = self._read_json_file(inbox_file)
        
        if mark_as_read:
            # 既読マークをつけて更新
            for msg in messages:
                if msg['status'] == 'pending':
                    msg['status'] = 'read'
                    msg['read_timestamp'] = datetime.now().isoformat()
            
            self._write_json_file(inbox_file, messages)
        
        return messages
    
    def get_unread_messages(self, agent_id: str) -> List[Dict]:
        """未読メッセージのみを取得"""
        messages = self.get_messages(agent_id, mark_as_read=False)
        return [msg for msg in messages if msg['status'] == 'pending']
    
    def update_agent_status(self, agent_id: str, status: str, capabilities: List[str] = None):
        """エージェントのステータスを更新"""
        if agent_id in self.agents:
            self.agents[agent_id]['status'] = status
            self.agents[agent_id]['last_seen'] = datetime.now().isoformat()
            if capabilities:
                self.agents[agent_id]['capabilities'] = capabilities
    
    def get_active_agents(self) -> Dict[str, Dict]:
        """アクティブなエージェントのリストを取得"""
        return {aid: info for aid, info in self.agents.items() if info['status'] == 'active'}
    
    def share_data(self, from_agent: str, data_key: str, data: Any, ttl_seconds: Optional[int] = None):
        """共有データを保存"""
        shared_data = {
            'key': data_key,
            'data': data,
            'from_agent': from_agent,
            'timestamp': datetime.now().isoformat(),
            'ttl_seconds': ttl_seconds
        }
        
        shared_file = self.shared_dir / f"{data_key}.json"
        self._write_json_file(shared_file, shared_data)
        
        self._log_system_event(f"Data shared: {data_key} by {from_agent}")
    
    def get_shared_data(self, data_key: str) -> Optional[Any]:
        """共有データを取得"""
        shared_file = self.shared_dir / f"{data_key}.json"
        
        if not shared_file.exists():
            return None
        
        shared_data = self._read_json_file(shared_file)
        
        # TTLチェック
        if shared_data.get('ttl_seconds'):
            created_time = datetime.fromisoformat(shared_data['timestamp'])
            if (datetime.now() - created_time).seconds > shared_data['ttl_seconds']:
                shared_file.unlink()
                return None
        
        return shared_data['data']
    
    def cleanup_old_messages(self, hours: int = 24):
        """古いメッセージをクリーンアップ"""
        cutoff_time = datetime.now().timestamp() - (hours * 3600)
        
        for inbox_file in self.messages_dir.glob("*_inbox.json"):
            messages = self._read_json_file(inbox_file)
            cleaned_messages = []
            
            for msg in messages:
                msg_time = datetime.fromisoformat(msg['timestamp']).timestamp()
                if msg_time > cutoff_time:
                    cleaned_messages.append(msg)
            
            if len(cleaned_messages) != len(messages):
                self._write_json_file(inbox_file, cleaned_messages)
    
    def _append_to_inbox(self, inbox_file: Path, message: Dict):
        """インボックスファイルにメッセージを追加（ファイルロック付き）"""
        try:
            with open(inbox_file, 'r+') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    messages = json.load(f)
                except json.JSONDecodeError:
                    messages = []
                
                messages.append(message)
                
                f.seek(0)
                json.dump(messages, f, indent=2)
                f.truncate()
        except FileNotFoundError:
            self._write_json_file(inbox_file, [message])
    
    def _read_json_file(self, file_path: Path) -> Any:
        """JSONファイルを安全に読み込み"""
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return [] if file_path.name.endswith('_inbox.json') else {}
    
    def _write_json_file(self, file_path: Path, data: Any):
        """JSONファイルを安全に書き込み"""
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _log_system_event(self, event: str):
        """システムイベントをログに記録"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'event': event
        }
        
        log_file = self.messages_dir / "system.log"
        with open(log_file, 'a') as f:
            f.write(json.dumps(log_entry) + "\n")


def main():
    """メッセージハブのスタンドアローン実行"""
    import sys
    
    if len(sys.argv) != 2:
        print("使用方法: python message_hub.py <communication_directory>")
        sys.exit(1)
    
    communication_dir = sys.argv[1]
    hub = MessageHub(communication_dir)
    
    print(f"Message Hub started in {communication_dir}")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nMessage Hub stopped")


if __name__ == "__main__":
    main()