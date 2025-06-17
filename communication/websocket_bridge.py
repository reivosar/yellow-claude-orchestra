#!/usr/bin/env python3
"""
WebSocket Bridge for Yellow Claude Orchestra
リアルタイムでエージェント状態とログをWebダッシュボードに送信
"""

import json
import time
import os
import sys
import psutil
import threading
from datetime import datetime
from pathlib import Path
import requests
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class OrchestraWebSocketBridge:
    def __init__(self, orchestra_dir: str = None):
        self.orchestra_dir = Path(orchestra_dir or os.getcwd())
        self.logs_dir = self.orchestra_dir / 'logs'
        self.communication_dir = self.orchestra_dir / 'communication'
        self.websocket_url = 'http://localhost:3000/api/websocket'
        
        # エージェント状態ファイル
        self.status_file = self.communication_dir / 'agent_status.json'
        
        # ファイル監視
        self.observer = Observer()
        
        # 実行中エージェントの追跡
        self.active_agents = {}
        
        print(f"WebSocket Bridge 初期化:")
        print(f"  Orchestra Directory: {self.orchestra_dir}")
        print(f"  Logs Directory: {self.logs_dir}")
        print(f"  Communication Directory: {self.communication_dir}")
    
    def detect_active_agents(self):
        """実行中のエージェントプロセスを検出"""
        agents = []
        
        try:
            # 既存のagent_status.jsonがあるかチェック
            if self.status_file.exists():
                try:
                    with open(self.status_file, 'r', encoding='utf-8') as f:
                        existing_agents = json.load(f)
                    
                    # Task Processorなど他のシステムが管理しているエージェントがあれば優先
                    system_agents = [agent for agent in existing_agents if agent.get('type') == 'system']
                    if system_agents:
                        print(f"既存のシステムエージェントを検出: {len(system_agents)}個")
                        # システムエージェントのみを返す（デモエージェントは追加しない）
                        return system_agents
                        
                except Exception as e:
                    print(f"既存エージェント状態読み込みエラー: {e}")
            
            # claude-codeプロセスを検索
            for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'create_time']):
                try:
                    if 'claude-code' in proc.info['name']:
                        cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
                        
                        # エージェントタイプを推定
                        agent_type = 'actor'  # デフォルト
                        if 'producer' in cmdline.lower():
                            agent_type = 'producer'
                        elif 'director' in cmdline.lower():
                            agent_type = 'director'
                        elif 'conductor' in cmdline.lower():
                            agent_type = 'director'  # conductorはdirectorとして扱う
                        
                        agent_id = f"{agent_type}-{proc.info['pid']}"
                        
                        agent_status = {
                            'id': agent_id,
                            'type': agent_type,
                            'name': agent_type.title(),
                            'status': 'active',
                            'currentTask': f'プロセス {proc.info["pid"]} で実行中',
                            'lastSeen': datetime.now().isoformat(),
                            'pid': proc.info['pid'],
                            'startTime': datetime.fromtimestamp(proc.info['create_time']).isoformat()
                        }
                        
                        agents.append(agent_status)
                        self.active_agents[agent_id] = agent_status
                        
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
            
            # Task Processorプロセスをチェック
            for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'create_time']):
                try:
                    if proc.info['cmdline'] and any('task_processor.py' in arg for arg in proc.info['cmdline']):
                        agent_status = {
                            'id': 'task-processor',
                            'type': 'system',
                            'name': 'Task Processor',
                            'status': 'active',
                            'currentTask': 'タスク処理システム稼働中',
                            'lastSeen': datetime.now().isoformat(),
                            'pid': proc.info['pid']
                        }
                        agents.append(agent_status)
                        print(f"Task Processorを検出: PID {proc.info['pid']}")
                        break
                        
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
                    
            # エージェントプロセスが見つからない場合のデモデータ
            if not agents:
                demo_agents = [
                    {
                        'id': 'producer-demo',
                        'type': 'producer',
                        'name': 'Producer (Demo)',
                        'status': 'idle',
                        'currentTask': 'デモモード - 待機中',
                        'lastSeen': datetime.now().isoformat(),
                        'pid': None
                    },
                    {
                        'id': 'director-demo',
                        'type': 'director', 
                        'name': 'Director (Demo)',
                        'status': 'idle',
                        'currentTask': 'デモモード - 待機中',
                        'lastSeen': datetime.now().isoformat(),
                        'pid': None
                    },
                    {
                        'id': 'actor-demo-1',
                        'type': 'actor',
                        'name': 'Actor 1 (Demo)',
                        'status': 'idle',
                        'currentTask': 'デモモード - 待機中',
                        'lastSeen': datetime.now().isoformat(),
                        'pid': None
                    }
                ]
                agents.extend(demo_agents)
                        
        except Exception as e:
            print(f"エージェント検出エラー: {e}")
            
        return agents
    
    def save_agent_status(self, agents):
        """エージェント状態をファイルに保存"""
        try:
            self.communication_dir.mkdir(exist_ok=True)
            with open(self.status_file, 'w', encoding='utf-8') as f:
                json.dump(agents, f, ensure_ascii=False, indent=2)
            print(f"エージェント状態を保存しました: {len(agents)}個のエージェント")
        except Exception as e:
            print(f"エージェント状態保存エラー: {e}")
    
    def send_to_websocket(self, event_type: str, data: dict):
        """WebSocketサーバーにデータを送信"""
        try:
            payload = {
                'type': 'broadcast',
                'event': event_type,
                'data': data
            }
            
            response = requests.post(self.websocket_url, json=payload, timeout=5)
            if response.status_code == 200:
                print(f"WebSocketに送信成功: {event_type}")
            else:
                print(f"WebSocket送信失敗: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"WebSocket送信エラー: {e}")
    
    def generate_demo_log(self):
        """デモ用のログを生成"""
        import random
        
        agent_types = ['producer', 'director', 'actor']
        messages = [
            'システムを初期化しています...',
            'タスクキューを確認中...',
            'エージェント間通信をテスト中...',
            'リアルタイム更新が正常に動作しています',
            'WebSocket接続が確立されました',
            'デモモードで動作中です',
            'ログ監視システムが動作しています'
        ]
        
        agent_type = random.choice(agent_types)
        message = random.choice(messages)
        
        log_entry = {
            'id': f"{int(time.time())}-{random.randint(1000, 9999)}",
            'timestamp': datetime.now().isoformat(),
            'agentType': agent_type,
            'agentId': f"{agent_type}-demo",
            'message': message,
            'level': 'info'
        }
        
        return log_entry
    
    def start_status_monitor(self):
        """エージェント状態の定期監視を開始"""
        def monitor_loop():
            while True:
                try:
                    # エージェント状態を検出
                    agents = self.detect_active_agents()
                    
                    # ファイルに保存
                    self.save_agent_status(agents)
                    
                    # WebSocketに送信
                    self.send_to_websocket('agents', agents)
                    
                    # デモログを生成（実際のログがない場合）
                    if not self.logs_dir.exists() or not list(self.logs_dir.glob('*.log')):
                        demo_log = self.generate_demo_log()
                        self.send_to_websocket('log', demo_log)
                    
                    time.sleep(5)  # 5秒間隔で更新
                    
                except Exception as e:
                    print(f"監視ループエラー: {e}")
                    time.sleep(10)
        
        monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
        monitor_thread.start()
        print("エージェント状態監視を開始しました")
    
    def run(self):
        """WebSocket Bridgeを開始"""
        print("Yellow Claude Orchestra WebSocket Bridge を開始します...")
        
        # 状態監視を開始
        self.start_status_monitor()
        
        # メインループ
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nWebSocket Bridge を停止します...")
            self.observer.stop()
            self.observer.join()

def main():
    # 引数からOrchestra ディレクトリを取得
    orchestra_dir = sys.argv[1] if len(sys.argv) > 1 else None
    
    # WebSocket Bridgeを作成して実行
    bridge = OrchestraWebSocketBridge(orchestra_dir)
    bridge.run()

if __name__ == '__main__':
    main()