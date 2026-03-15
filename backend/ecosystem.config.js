module.exports = {
  apps: [{
    name: 'expiry-backend',
    script: 'src/app.js',
    cwd: '/var/www/expiry-management-system/backend',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: '/var/www/expiry-management-system/backend/logs/error.log',
    out_file: '/var/www/expiry-management-system/backend/logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
