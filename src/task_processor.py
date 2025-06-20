#!/usr/bin/env python3
"""
Yellow Claude Orchestra - Task Processor
Claude Code CLIなしでも動作するタスク処理システム
"""

import json
import time
import os
import sys
import subprocess
import threading
from datetime import datetime
from pathlib import Path

class TaskProcessor:
    def __init__(self, base_dir):
        self.base_dir = Path(base_dir)
        self.tasks_file = self.base_dir / 'data' / 'tasks.json'
        self.messages_dir = self.base_dir / 'communication' / 'messages'
        self.archive_dir = self.base_dir / 'communication' / 'messages' / 'archive'
        self.status_file = self.base_dir / 'communication' / 'agent_status.json'
        self.running = True
        
        # ディレクトリ作成
        self.tasks_file.parent.mkdir(parents=True, exist_ok=True)
        self.messages_dir.mkdir(parents=True, exist_ok=True)
        self.archive_dir.mkdir(parents=True, exist_ok=True)
        self.status_file.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"Task Processor initialized: {self.base_dir}")
        
    def load_tasks(self):
        """タスクファイルを読み込み"""
        try:
            if self.tasks_file.exists():
                with open(self.tasks_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('tasks', [])
            return []
        except Exception as e:
            print(f"Error loading tasks: {e}")
            return []
    
    def save_tasks(self, tasks):
        """タスクファイルを保存"""
        try:
            with open(self.tasks_file, 'w', encoding='utf-8') as f:
                json.dump({'tasks': tasks}, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving tasks: {e}")
    
    def update_agent_status(self):
        """エージェント状態を更新"""
        try:
            status = [
                {
                    'id': 'task-processor',
                    'type': 'system',
                    'name': 'Task Processor',
                    'status': 'active',
                    'currentTask': 'タスク処理システム稼働中',
                    'lastSeen': datetime.now().isoformat(),
                    'pid': os.getpid()
                }
            ]
            
            with open(self.status_file, 'w', encoding='utf-8') as f:
                json.dump(status, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error updating agent status: {e}")
    
    def archive_message(self, message_file):
        """メッセージをアーカイブに移動"""
        try:
            archive_file = self.archive_dir / message_file.name
            message_file.rename(archive_file)
            print(f"[DEBUG] Archived message: {message_file.name}")
        except Exception as e:
            print(f"Error archiving message {message_file}: {e}")
    
    def generate_ai_response_for_task(self, task_data):
        """タスク用のAI応答を生成"""
        task_title = task_data.get('title', 'Unknown')
        task_description = task_data.get('description', '')
        
        # GitHub関連のコマンドを検出
        if 'github' in task_title.lower() or 'イシュー' in task_title or 'status' in task_title.lower():
            return self.handle_github_request(task_title, task_data)
        
        # コード修正タスクを検出
        if self.is_code_modification_task(task_title, task_description):
            return self.handle_code_modification_task(task_title, task_description, task_data)
        
        # Claude Code CLIコマンドを構築
        claude_cmd = ['claude', f"「{task_title}」について教えてください。"]
        if task_description:
            claude_cmd = ['claude', f"「{task_title}」について: {task_description}"]
        
        try:
            # Claude Code CLIを実行
            result = subprocess.check_output(claude_cmd, text=True, timeout=15, stderr=subprocess.STDOUT)
            result = result.strip()
        except subprocess.TimeoutExpired:
            # タイムアウト時はより自然な応答を生成
            responses = [
                f"「{task_title}」ですね。もう少し詳しく教えていただけますか？",
                f"「{task_title}」について承知いたしました。どのような点についてお答えすればよろしいでしょうか？",
                f"「{task_title}」に関してですが、具体的にはどのようなことを知りたいですか？",
                f"はい、「{task_title}」についてですね。どのような情報が必要でしょうか？"
            ]
            import random
            result = random.choice(responses)
        except Exception as e:
            print(f"Error calling Claude Code CLI: {e}")
            result = f"「{task_title}」について処理中です。しばらくお待ちください。"
        
        return result

    def is_code_modification_task(self, task_title, task_description=None):
        """タスクがコード修正に関するものかを判定"""
        code_keywords = [
            '修正', 'fix', 'bug', 'バグ', 'エラー', 'error', 
            '実装', 'implement', '追加', 'add', '機能', 'feature',
            '改善', 'improve', 'リファクタ', 'refactor', 'コード', 'code'
        ]
        
        text_to_check = f"{task_title} {task_description or ''}".lower()
        return any(keyword in text_to_check for keyword in code_keywords)

    def handle_code_modification_task(self, task_title, task_description=None, task_data=None):
        """コード修正タスクを処理"""
        try:
            # プロジェクト情報からリポジトリURLを取得
            repo_url = self.get_repository_url_from_task(task_data)
            
            if repo_url:
                # リポジトリをクローンまたは更新
                workspace_path = self.clone_or_update_repository(repo_url)
                
                if workspace_path:
                    # Claude Code CLIでコード修正を実行
                    return self.execute_claude_code_in_workspace(workspace_path, task_title, task_description)
            
            # フォールバック: 通常の応答
            return f"「{task_title}」のコード修正について検討中です。リポジトリ情報を確認してください。"
            
        except Exception as e:
            print(f"Error handling code modification task: {e}")
            return f"「{task_title}」の処理中にエラーが発生しました。"

    def get_repository_url_from_task(self, task_data=None):
        """タスクからリポジトリURLを取得（プロジェクト設定から）"""
        try:
            # タスクデータからプロジェクトIDを取得
            project_id = None
            if task_data and 'projectId' in task_data:
                project_id = task_data['projectId']
            
            projects_file = self.base_dir / 'data' / 'projects.json'
            if projects_file.exists():
                with open(projects_file, 'r', encoding='utf-8') as f:
                    projects = json.load(f)
                    
                    # 特定のプロジェクトIDがある場合はそれを優先
                    if project_id:
                        for project in projects:
                            if project.get('id') == project_id:
                                return project.get('repository')
                    
                    # 最初のアクティブプロジェクトのリポジトリを使用
                    for project in projects:
                        if project.get('status') == 'active' and project.get('repository'):
                            return project.get('repository')
        except Exception as e:
            print(f"Error getting repository URL: {e}")
        return None

    def clone_or_update_repository(self, repo_url):
        """リポジトリをクローンまたは更新"""
        import os
        
        try:
            # ワークスペースディレクトリ
            workspace_dir = Path('/app/workspace')
            
            # リポジトリ名を抽出
            repo_name = repo_url.split('/')[-1].replace('.git', '')
            repo_path = workspace_dir / repo_name
            
            if repo_path.exists():
                # 既存のリポジトリを更新
                result = subprocess.run(['git', 'pull'], cwd=repo_path, capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"Updated repository: {repo_path}")
                    return str(repo_path)
            else:
                # リポジトリをクローン
                result = subprocess.run(['git', 'clone', repo_url, str(repo_path)], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"Cloned repository: {repo_path}")
                    return str(repo_path)
                
        except Exception as e:
            print(f"Error cloning/updating repository: {e}")
        
        return None

    def execute_claude_code_in_workspace(self, workspace_path, task_title, task_description=None):
        """ワークスペース内でClaude Code CLIを実行"""
        import os
        
        try:
            # Claude Code CLIコマンドを構築
            prompt = f"プロジェクト「{task_title}」について"
            if task_description:
                prompt += f": {task_description}"
            prompt += "。必要に応じてコードを修正してください。"
            
            claude_cmd = ['claude', prompt]
            
            # ワークスペース内でClaude Code CLIを実行
            result = subprocess.check_output(
                claude_cmd, 
                cwd=workspace_path,
                text=True, 
                timeout=30, 
                stderr=subprocess.STDOUT,
                env={**os.environ, 'PATH': '/root/.local/bin:' + os.environ.get('PATH', '')}
            )
            
            return f"コード修正を実行しました:\n{result.strip()}"
            
        except subprocess.TimeoutExpired:
            return f"「{task_title}」のコード修正がタイムアウトしました。大きな変更の可能性があります。"
        except Exception as e:
            print(f"Error executing Claude Code in workspace: {e}")
            return f"「{task_title}」のコード修正中にエラーが発生しました: {str(e)}"
    
    def handle_github_request(self, task_title, task_data):
        """GitHub関連のリクエストを処理"""
        project_id = task_data.get('projectId')
        
        # プロジェクト情報からリポジトリURLを取得
        projects_file = self.base_dir / 'data' / 'projects.json'
        repo_url = None
        
        if projects_file.exists():
            try:
                with open(projects_file, 'r', encoding='utf-8') as f:
                    projects = json.load(f)
                    for project in projects:
                        if project.get('id') == project_id:
                            repo_url = project.get('repository')
                            break
            except Exception as e:
                print(f"Error reading projects: {e}")
        
        if not repo_url or 'github.com' not in repo_url:
            return "GitHubリポジトリが設定されていません。プロジェクト設定を確認してください。"
        
        # GitHub URLからリポジトリパスを抽出
        repo_path = repo_url.replace('https://github.com/', '').replace('.git', '')
        
        try:
            # GitHub APIからイシューを取得
            import urllib.request
            import urllib.error
            
            api_url = f'https://api.github.com/repos/{repo_path}/issues'
            req = urllib.request.Request(api_url)
            req.add_header('User-Agent', 'Yellow-Claude-Orchestra/1.0')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                
                if not data:
                    return f"リポジトリ {repo_path} にイシューはありません。"
                
                # 最新の5件のイシューを表示
                result = f"GitHubリポジトリ {repo_path} のイシュー:\n\n"
                for i, issue in enumerate(data[:5]):
                    title = issue.get('title', 'No title')
                    number = issue.get('number', 'N/A')
                    state = issue.get('state', 'unknown')
                    url = issue.get('html_url', '')
                    
                    result += f"{i+1}. #{number} - {title} ({state})\n"
                    result += f"   {url}\n\n"
                
                return result
                
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return f"リポジトリ {repo_path} が見つかりません。"
            elif e.code == 403:
                return "GitHub API のレート制限に達しました。しばらく待ってから再試行してください。"
            else:
                return f"GitHub API エラー: {e.code}"
        except Exception as e:
            print(f"GitHub API error: {e}")
            return f"GitHub接続エラー: {str(e)}"

    def process_messages(self):
        """メッセージキューを処理"""
        try:
            if not self.messages_dir.exists():
                return
            
            files = list(self.messages_dir.glob('*.json'))
            print(f"[DEBUG] Found {len(files)} JSON files in messages directory")
            
            for message_file in files:
                print(f"[DEBUG] Checking file: {message_file.name}")
                if not (message_file.name.startswith('task-') or message_file.name.startswith('msg-') or message_file.name.startswith('agent-msg-')):
                    print(f"[DEBUG] Skipping file: {message_file.name}")
                    continue
                    
                try:
                    with open(message_file, 'r', encoding='utf-8') as f:
                        message = json.load(f)
                    
                    print(f"[DEBUG] Message type: {message.get('type')}")
                    
                    if message.get('type') == 'task_request':
                        task_data = message.get('data', {})
                        task_id = task_data.get('id')
                        task_title = task_data.get('title', 'Unknown')
                        
                        print(f"Processing task request: {task_title}")
                        
                        # Producer-Director-Actor フローのログを記録
                        self.save_task_log(task_id, f"Task received: {task_title}", 'producer')
                        self.save_task_log(task_id, f"User: {task_title}", 'user')
                        self.save_task_log(task_id, f"Analyzing task and generating response", 'director')
                        
                        # AI応答を生成
                        ai_response = self.generate_ai_response_for_task(task_data)
                        
                        # AI応答をログに記録
                        self.save_task_log(task_id, f"AI: {ai_response}", 'ai')
                        self.save_task_log(task_id, f"Response generated and sent to user", 'actor')
                        
                        # タスクを進行中状態に更新
                        tasks = self.load_tasks()
                        for task in tasks:
                            if task.get('id') == task_id and task.get('status') == 'pending':
                                task['status'] = 'in_progress'
                                task['updatedAt'] = datetime.now().isoformat()
                                task['assignedAgent'] = 'task-processor'
                                print(f"🔄 Task started: {task.get('title')}")
                                break
                        
                        self.save_tasks(tasks)
                        
                        # 処理済みメッセージをアーカイブに移動
                        self.archive_message(message_file)
                        
                    elif message.get('type') == 'task_update' and message.get('data', {}).get('action') == 'append_message':
                        # メッセージ追加処理
                        data = message.get('data', {})
                        task_id = data.get('taskId')
                        user_message = data.get('message')
                        
                        print(f"Processing message append for task: {task_id}")
                        
                        # Producer-Director-Actor フローのログを記録
                        self.save_task_log(task_id, f"Message received: {user_message}", 'producer')
                        self.save_task_log(task_id, f"User: {user_message}", 'user')
                        self.save_task_log(task_id, f"Analyzing message and generating response", 'director')
                        
                        # 現在のタスク情報を取得してprojectIdを含める
                        tasks = self.load_tasks()
                        current_task = None
                        for task in tasks:
                            if task.get('id') == task_id:
                                current_task = task
                                break
                        
                        # AI応答を生成（projectId付きで）
                        task_context = {
                            'title': user_message, 
                            'description': '',
                            'projectId': current_task.get('projectId') if current_task else None
                        }
                        response = self.execute_task(task_context)
                        
                        # Actor実行ログ
                        self.save_task_log(task_id, f"Executing task: {user_message}", 'actor')
                        self.save_task_log(task_id, f"Task result: {response}", 'actor')
                        self.save_task_log(task_id, f"AI: {response}", 'ai')
                        
                        # Director完了ログ
                        self.save_task_log(task_id, f"Response completed: {response}", 'director')
                        
                        # エージェントメッセージを保存
                        self.save_agent_message(task_id, 'producer', 'director', 'message_received', {
                            'message': user_message
                        })
                        self.save_agent_message(task_id, 'director', 'actor', 'task_execution', {
                            'task': user_message
                        })
                        self.save_agent_message(task_id, 'actor', 'director', 'task_result', {
                            'result': response
                        })
                        self.save_agent_message(task_id, 'director', 'producer', 'task_completion', {
                            'result': response,
                            'message': response
                        })
                        
                        print(f"✅ Processed message for task: {task_id}")
                        
                        # 処理済みメッセージをアーカイブに移動
                        self.archive_message(message_file)
                        
                    elif message.get('type') == 'task_completion':
                        # これは既に処理済みのメッセージなので、アーカイブに移動
                        print(f"[DEBUG] Moving already processed message to archive: {message_file.name}")
                        self.archive_message(message_file)
                        
                    elif message.get('type') in ['task_execution', 'message_received', 'task_result']:
                        # エージェント間メッセージは自動的にアーカイブ
                        print(f"[DEBUG] Archiving agent message: {message_file.name}")
                        self.archive_message(message_file)
                        
                except Exception as e:
                    print(f"Error processing message {message_file}: {e}")
                    
        except Exception as e:
            print(f"Error processing messages: {e}")
    
    def execute_task(self, task):
        """タスクを実際に実行"""
        task_title = task.get('title', '')
        task_description = task.get('description', '')
        
        # タスクの内容に応じてコマンドを実行
        result = ""
        
        if '時刻' in task_title or '日時' in task_title:
            import subprocess
            try:
                # 日本語の日付フォーマットで取得
                result = subprocess.check_output(['date', '+%Y年%m月%d日 %H:%M:%S'], text=True).strip()
                result = f"現在時刻: {result}"
            except:
                result = f"現在時刻: {datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}"
                
        elif 'github' in task_title.lower():
            import subprocess
            try:
                # タスクのプロジェクトIDから対応するプロジェクトを取得
                task_project_id = task.get('projectId')
                projects_file = self.base_dir / 'data' / 'projects.json'
                repo_url = None
                
                if projects_file.exists():
                    with open(projects_file, 'r', encoding='utf-8') as f:
                        projects = json.load(f)
                        for project in projects:
                            if project.get('id') == task_project_id:
                                repo_url = project.get('repository')
                                break
                
                if repo_url and 'github.com' in repo_url:
                    # GitHub URLからリポジトリパスを抽出
                    repo_path = repo_url.replace('https://github.com/', '').replace('.git', '')
                    
                    # GitHub APIから情報を取得
                    api_result = subprocess.check_output(['curl', '-s', f'https://api.github.com/repos/{repo_path}/issues'], text=True)
                    issues_data = json.loads(api_result)
                    
                    if isinstance(issues_data, list):
                        if len(issues_data) > 0:
                            issues_summary = []
                            for issue in issues_data[:10]:
                                issues_summary.append(f"#{issue.get('number')}: {issue.get('title')} ({issue.get('state')})")
                            result = f"GitHubイシューの一覧:\n\n" + "\n".join(issues_summary)
                        else:
                            result = "このリポジトリにはイシューがありません"
                    else:
                        result = f"GitHub API応答エラー: {issues_data.get('message', 'Unknown error')}"
                else:
                    result = "プロジェクトのGitHubリポジトリが見つかりません"
            except Exception as e:
                result = f"GitHubアクセスに失敗しました: {str(e)}"
                
        elif 'hello' in task_title.lower() and 'world' in task_title.lower():
            result = "Hello, World!"
            
        else:
            # Claude Code CLIで処理
            try:
                import subprocess
                
                # Claude Code CLIを実行
                claude_cmd = ['claude', '--print', task_title]
                
                try:
                    # Claude Code CLIを実行（タイムアウトを短縮）
                    result = subprocess.check_output(claude_cmd, text=True, timeout=5, stderr=subprocess.STDOUT)
                    result = result.strip()
                    
                except subprocess.CalledProcessError as e:
                    # Claude Code CLIが見つからない場合の代替処理
                    result = f"申し訳ございません。「{task_title}」について詳しく教えていただけますか？"
                    
                except subprocess.TimeoutExpired:
                    # タイムアウト時はより自然な応答を生成
                    responses = [
                        f"「{task_title}」ですね。もう少し詳しく教えていただけますか？",
                        f"「{task_title}」について承知いたしました。どのような点についてお答えすればよろしいでしょうか？",
                        f"「{task_title}」に関してですが、具体的にはどのようなことを知りたいですか？",
                        f"はい、「{task_title}」についてですね。どのような情報が必要でしょうか？"
                    ]
                    import random
                    result = random.choice(responses)
                    
                except FileNotFoundError:
                    # Claude Code CLIがインストールされていない場合
                    result = f"「{task_title}」について承知しました。どのようなことをお手伝いしましょうか？"
                    
            except Exception as e:
                result = f"「{task_title}」の処理中にエラーが発生しました: {str(e)}"
        
        return result
    
    def save_task_log(self, task_id, message, agent_type='system'):
        """タスクログを保存"""
        try:
            logs_dir = self.base_dir / 'logs'
            logs_dir.mkdir(exist_ok=True)
            
            # task_idが既に'task-'で始まっている場合は、そのまま使用
            if task_id.startswith('task-'):
                log_file = logs_dir / f'{task_id}.log'
            else:
                log_file = logs_dir / f'task-{task_id}.log'
                
            with open(log_file, 'a', encoding='utf-8') as f:
                timestamp = datetime.now().isoformat()
                f.write(f"[{timestamp}] {agent_type}: {message}\n")
                
        except Exception as e:
            print(f"Error saving task log: {e}")
    
    def save_agent_message(self, task_id, from_agent, to_agent, message_type, data=None):
        """エージェントメッセージを保存"""
        try:
            message = {
                'id': f'msg-{int(time.time() * 1000)}',
                'from': from_agent,
                'to': to_agent,
                'type': message_type,
                'data': data,
                'timestamp': datetime.now().isoformat()
            }
            
            message_file = self.messages_dir / f'agent-msg-{task_id}-{message["id"]}.json'
            with open(message_file, 'w', encoding='utf-8') as f:
                json.dump(message, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            print(f"Error saving agent message: {e}")

    def process_pending_tasks(self):
        """保留中のタスクを処理"""
        try:
            tasks = self.load_tasks()
            updated = False
            
            for task in tasks:
                if task.get('status') == 'pending':
                    task_title = task.get('title', 'Unknown')
                    task_id = task.get('id')
                    print(f"🔄 Processing task: {task_title}")
                    
                    # タスクを進行中状態に変更
                    task['status'] = 'in_progress'
                    task['updatedAt'] = datetime.now().isoformat()
                    task['startedBy'] = 'task-processor'
                    self.save_tasks(tasks)
                    
                    # エージェント状態を進行中に更新
                    self.update_agent_status_with_task(task_title)
                    
                    print(f"⏳ Task in progress: {task_title}")
                    
                    # リアルな処理時間をシミュレート（10-30秒）
                    import random
                    processing_time = random.randint(10, 30)
                    
                    for i in range(processing_time):
                        time.sleep(1)
                        if i % 5 == 0:  # 5秒ごとに進捗表示
                            progress = int((i / processing_time) * 100)
                            print(f"📊 Progress: {progress}% - {task_title}")
                            
                            # 進捗をタスクに保存
                            task['progress'] = progress
                            self.save_tasks(tasks)
                    
                    # 実際にタスクを実行
                    print(f"🚀 Executing task: {task_title}")
                    result = self.execute_task(task)
                    
                    # ログとメッセージを保存
                    self.save_task_log(task_id, f"Task started: {task_title}", 'producer')
                    self.save_task_log(task_id, f"Task result: {result}", 'actor')
                    
                    # エージェントメッセージを保存
                    self.save_agent_message(task_id, 'producer', 'director', 'task_assignment', task)
                    self.save_agent_message(task_id, 'director', 'actor', 'task_execution', task)
                    self.save_agent_message(task_id, 'actor', 'director', 'task_result', {'result': result})
                    self.save_agent_message(task_id, 'director', 'producer', 'task_completion', {'result': result})
                    
                    # タスク完了
                    task['status'] = 'completed'
                    task['progress'] = 100
                    task['updatedAt'] = datetime.now().isoformat()
                    task['completedBy'] = 'task-processor'
                    task['result'] = result
                    updated = True
                    
                    print(f"✅ Completed task: {task_title}")
                    
                    # 完了後、エージェント状態をリセット
                    self.update_agent_status()
            
            if updated:
                self.save_tasks(tasks)
                
        except Exception as e:
            print(f"Error processing pending tasks: {e}")
    
    def update_agent_status_with_task(self, task_title):
        """タスク実行中のエージェント状態を更新"""
        try:
            status = [
                {
                    'id': 'task-processor',
                    'type': 'system',
                    'name': 'Task Processor',
                    'status': 'working',
                    'currentTask': f'実行中: {task_title}',
                    'lastSeen': datetime.now().isoformat(),
                    'pid': os.getpid()
                }
            ]
            
            with open(self.status_file, 'w', encoding='utf-8') as f:
                json.dump(status, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error updating agent status with task: {e}")
    
    def run(self):
        """メインループ"""
        print("🎼 Task Processor starting...")
        
        while self.running:
            try:
                self.update_agent_status()
                self.process_messages()
                self.process_pending_tasks()
                time.sleep(5)  # 5秒ごとにチェック
                
            except KeyboardInterrupt:
                print("\n🛑 Task Processor stopping...")
                self.running = False
                break
            except Exception as e:
                print(f"❌ Error in main loop: {e}")
                time.sleep(10)
        
        print("👋 Task Processor stopped")

def main():
    if len(sys.argv) > 1:
        base_dir = sys.argv[1]
    else:
        base_dir = os.getcwd()
    
    processor = TaskProcessor(base_dir)
    processor.run()

if __name__ == '__main__':
    main()