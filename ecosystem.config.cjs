module.exports = {
  apps: [
    {
      name: "wwchun-top",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/wwchun.top",
      instances: 1,
      autorestart: true,
      wait_ready: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
}
