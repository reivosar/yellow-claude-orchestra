module.exports = {
  apps: [{
    name: 'yellow-claude-orchestra-web',
    script: './node_modules/.bin/next',
    args: 'dev',
    cwd: '/Users/mac/Workspace/yellow-claude-orchestra/web-dashboard',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}