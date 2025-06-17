// Yellow Claude Orchestra - Agent Types

export interface AgentLog {
  id: string
  timestamp: string
  agentType: 'producer' | 'director' | 'actor' | 'system'
  agentId: string
  message: string
  level: 'info' | 'warn' | 'error' | 'debug'
  data?: any
}

export interface AgentStatus {
  id: string
  type: 'producer' | 'director' | 'actor' | 'system'
  name: string
  status: 'active' | 'idle' | 'working' | 'error' | 'offline'
  currentTask?: string
  lastSeen: string
  pid?: number
}

export interface ProjectInfo {
  id: string
  name: string
  repository: string
  status: 'active' | 'paused' | 'completed'
  issues: {
    total: number
    completed: number
    inProgress: number
    pending: number
  }
  lastActivity: string
}

export interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  agents: {
    total: number
    active: number
    maxActors: number
  }
  uptime: string
}

export interface OrchestraState {
  agents: AgentStatus[]
  projects: ProjectInfo[]
  logs: AgentLog[]
  metrics: SystemMetrics
  isConnected: boolean
  lastUpdate: string
}