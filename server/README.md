# GitHub Contribution API Server

后端服务，用于获取 GitHub 贡献数据并提供缓存。

## 功能

- 获取指定仓库的贡献统计（Issues、PRs、Additions、Deletions）
- 内存缓存（1 小时 TTL）
- CORS 支持
- 健康检查端点

## 部署步骤

### 1. 安装依赖

```bash
cd server
bun install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
PORT=3001
GITHUB_TOKEN=your_github_personal_access_token
```

### 3. 本地开发

```bash
bun run dev
```

### 4. 部署到 VPS

```bash
# 使用部署脚本
./deploy.sh

# 或手动部署
scp -r ./* root@ssh.wwchun.top:/opt/github-contribution-api/
ssh root@ssh.wwchun.top "cd /opt/github-contribution-api && bun install && systemctl restart github-contribution-api"
```

### 5. 配置 Nginx

将 `nginx.conf` 复制到 VPS 的 `/etc/nginx/sites-available/` 并创建符号链接：

```bash
scp nginx.conf root@ssh.wwchun.top:/etc/nginx/sites-available/wwchun.top
ssh root@ssh.wwchun.top "ln -sf /etc/nginx/sites-available/wwchun.top /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx"
```

### 6. 配置 systemd 服务

将 `github-contribution-api.service` 复制到 VPS：

```bash
scp github-contribution-api.service root@ssh.wwchun.top:/etc/systemd/system/
ssh root@ssh.wwchun.top "systemctl daemon-reload && systemctl enable github-contribution-api && systemctl start github-contribution-api"
```

## API 端点

### 获取贡献数据

```
GET /api/github/contributions/:owner/:repo
```

**响应示例：**

```json
{
  "repo": "predidit/kazumi",
  "repoUrl": "https://github.com/predidit/kazumi",
  "stars": 1234,
  "owner": {
    "login": "predidit",
    "avatarUrl": "https://avatars.githubusercontent.com/u/..."
  },
  "contributions": {
    "issues": 5,
    "pullRequests": 12,
    "additions": 1234,
    "deletions": 567,
    "lastContributionDate": "2026-01-15"
  }
}
```

### 健康检查

```
GET /health
```

**响应示例：**

```json
{
  "status": "ok",
  "timestamp": "2026-01-15T12:00:00.000Z"
}
```

## 前端使用

在 React 组件中使用 `GitHubContributionCard`：

```tsx
import { GitHubContributionCard } from '@/components/github-contribution-card'

function MyPage() {
  return (
    <div>
      <GitHubContributionCard repo="predidit/kazumi" />
    </div>
  )
}
```

## 缓存策略

- 内存缓存：1 小时 TTL
- 缓存键：`{owner}:{repo}`
- 缓存数据包含时间戳，过期后自动重新获取

## 故障排除

### 检查服务状态

```bash
ssh root@ssh.wwchun.top "systemctl status github-contribution-api"
```

### 查看日志

```bash
ssh root@ssh.wwchun.top "journalctl -u github-contribution-api -f"
```

### 测试 API

```bash
curl https://wwchun.top/api/github/contributions/predidit/kazumi
```
