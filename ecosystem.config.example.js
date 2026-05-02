module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
        DB_HOST: '127.0.0.1',
        DB_PORT: '3306',
        DB_NAME: 'sistema_dental',
        DB_USER: 'your_db_user',
        DB_PASSWORD: 'your_db_password',
        JWT_SECRET: 'your-super-secret-jwt-key',
        JWT_EXPIRES_IN: '7d',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_USER: 'your_email@gmail.com',
        SMTP_PASS: 'your_email_app_password',
        EMAIL_FROM: 'your_email@gmail.com',
        TZ: 'America/Santiago',
        PORT: '4000'
      }
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
        NEXT_PUBLIC_API_URL: 'http://your-server-ip:4000'
      }
    }
  ]
}
