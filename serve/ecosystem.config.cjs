module.exports = {
  apps: [
    {
      name: 'media-forum-api',
      script: './index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 4000,
      },
    },
  ],
};
