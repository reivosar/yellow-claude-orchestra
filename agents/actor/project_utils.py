#!/usr/bin/env python3
"""
Actor エージェント用のプロジェクト管理ユーティリティ

プロジェクト固有の CLAUDE.md ファイルを読み込み、
そのプロジェクトに最適化された開発環境情報を取得します。
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Optional, Any

def get_project_claude_config(project_id: str) -> Optional[Dict[str, Any]]:
    """
    指定されたプロジェクトの CLAUDE.md ファイルを読み込み、
    そのプロジェクトの設定情報を取得します。
    
    Args:
        project_id: プロジェクトID
        
    Returns:
        プロジェクト設定情報の辞書、または None（見つからない場合）
    """
    try:
        # プロジェクト情報を取得
        projects_file = Path(__file__).parent.parent.parent / "data" / "projects.json"
        
        if not projects_file.exists():
            logging.warning(f"Projects file not found: {projects_file}")
            return None
            
        with open(projects_file, 'r', encoding='utf-8') as f:
            projects = json.load(f)
            
        # 指定されたプロジェクトを検索
        project = None
        for p in projects:
            if p.get('id') == project_id:
                project = p
                break
                
        if not project:
            logging.warning(f"Project not found: {project_id}")
            return None
            
        # プロジェクトディレクトリのパスを構築
        project_name = project.get('repository') or project.get('name')
        project_dir = Path(__file__).parent.parent.parent / "projects" / project_name
        claude_file = project_dir / "CLAUDE.md"
        
        if not claude_file.exists():
            logging.warning(f"CLAUDE.md not found: {claude_file}")
            return None
            
        # CLAUDE.md ファイルを読み込み
        with open(claude_file, 'r', encoding='utf-8') as f:
            claude_content = f.read()
            
        return {
            'project': project,
            'project_dir': str(project_dir),
            'claude_file': str(claude_file),
            'claude_content': claude_content,
            'config': parse_claude_config(claude_content)
        }
        
    except Exception as e:
        logging.error(f"Error loading project config: {e}")
        return None

def parse_claude_config(content: str) -> Dict[str, Any]:
    """
    CLAUDE.md の内容を解析して設定情報を抽出します。
    
    Args:
        content: CLAUDE.md の内容
        
    Returns:
        設定情報の辞書
    """
    config = {
        'commands': {},
        'dependencies': [],
        'testing': {},
        'deployment': {},
        'structure': {}
    }
    
    lines = content.split('\n')
    current_section = None
    
    for line in lines:
        line = line.strip()
        
        # セクションヘッダーを検出
        if line.startswith('##'):
            current_section = line.replace('#', '').strip().lower()
        elif line.startswith('```bash') or line.startswith('```'):
            # コードブロック内のコマンドを抽出
            continue
        elif current_section and line:
            # 各セクションの内容を解析
            if 'コマンド' in current_section and line.startswith('npm '):
                parts = line.split(' ', 2)
                if len(parts) >= 2:
                    config['commands'][parts[1]] = line
                    
    return config

def get_project_working_directory(project_id: str) -> Optional[str]:
    """
    指定されたプロジェクトの作業ディレクトリを取得します。
    
    Args:
        project_id: プロジェクトID
        
    Returns:
        プロジェクトの作業ディレクトリパス、または None
    """
    project_config = get_project_claude_config(project_id)
    if project_config:
        return project_config['project_dir']
    return None

def update_claude_task_history(project_id: str, task_info: Dict[str, Any]) -> bool:
    """
    プロジェクトの CLAUDE.md にタスク履歴を追加します。
    
    Args:
        project_id: プロジェクトID
        task_info: タスク情報
        
    Returns:
        更新が成功したかどうか
    """
    try:
        project_config = get_project_claude_config(project_id)
        if not project_config:
            return False
            
        claude_file = project_config['claude_file']
        content = project_config['claude_content']
        
        # タスク履歴セクションを探してタスクを追加
        task_entry = f"""
### {task_info.get('title', 'タスク')} - {task_info.get('created_at', '')}
- **ステータス**: {task_info.get('status', 'unknown')}
- **担当**: {task_info.get('agent', 'Actor')}
- **説明**: {task_info.get('description', '')}

"""
        
        # "## タスク履歴" セクションの後に追加
        if "## タスク履歴" in content:
            parts = content.split("## タスク履歴")
            if len(parts) >= 2:
                # 既存のタスク履歴セクションに追加
                history_section = parts[1]
                next_section_pos = history_section.find("\n## ")
                
                if next_section_pos != -1:
                    # 次のセクションがある場合
                    new_content = (parts[0] + "## タスク履歴" + 
                                 history_section[:next_section_pos] + 
                                 task_entry +
                                 history_section[next_section_pos:])
                else:
                    # タスク履歴が最後のセクションの場合
                    new_content = parts[0] + "## タスク履歴" + history_section + task_entry
                    
                # ファイルに書き込み
                with open(claude_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                    
                return True
                
        return False
        
    except Exception as e:
        logging.error(f"Error updating task history: {e}")
        return False

if __name__ == "__main__":
    # テスト用
    logging.basicConfig(level=logging.INFO)
    
    # 利用例
    config = get_project_claude_config("project-1234567890")
    if config:
        print(f"Project dir: {config['project_dir']}")
        print(f"Commands: {config['config']['commands']}")
    else:
        print("Project config not found")