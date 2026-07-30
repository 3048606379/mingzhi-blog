# Tenet Blog

基于 **Next.js 16 + React 19 + Tailwind CSS 4** 的个人博客。内容直接存本地文件系统，通过密码鉴权在线编辑，发布即时生效，无需等待部署。

> 原项目：[2025-blog-public](https://github.com/YYsuni/2025-blog-public)

## 功能

- **博客** `/blog`：Markdown 写作（`/write`），代码高亮（Shiki）、KaTeX 公式、图片上传、分级标题自动生成目录
- **项目 / 分享 / 友链 / 关于**：`/projects`、`/share`、`/bloggers`、`/about`
- **图片** `/pictures`：相册展示、上传压缩
- **小工具**：`/snippets`、`/svgs`、`/image-toolbox`、`/music`、`/clock`、`/live2d` 等
- 暗色终端风格 UI：等宽字体、网格背景、自定义光标、页面 glitch 转场、悬浮导航栏
- 全站内容通过前端 UI 在线编辑，密码鉴权即改即生效

## 本地开发

```bash
npm install
cp .env.example .env    # 编辑密码
npm run dev             # http://localhost:2025
```

## 部署（自有服务器）

```bash
# 1. 上传项目到服务器
# 2. 服务器上
cp .env.example .env    # 编辑 AUTH_PASSWORD 和 PORT
npm install
npm run build
npm run start           # 或使用宝塔面板 / PM2 守护进程
```

> 不需要数据库，不需要 GitHub App，不需要等部署。发布即生效。

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `AUTH_PASSWORD` | `admin` | 后台操作密码 |
| `PORT` | `2025` | 服务端口 |

## 目录结构

```
src/
├── app/            # 路由页面
│   ├── (home)/     # 首页
│   ├── write/      # 文章编辑器
│   ├── blog/       # 博客列表与详情
│   ├── api/        # 后端 API（文件读写）
│   └── ...         # 其他页面
├── components/     # 全局组件
├── layout/         # 全局布局
├── hooks/          # 自定义 hooks
├── lib/            # 工具函数
├── config/         # 站点配置
└── styles/         # 全局样式与动画
```

## License

MIT
