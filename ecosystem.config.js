module.exports = {
  apps: [
    {
      name: 'expiry-webhook',
      script: 'deploy/webhook.js',
      cwd: '/var/www/expiry-management-system',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 9000
      }
    }
  ]
};
