# 2025 Blog

基于 **Next.js 16 + React 19 + Tailwind CSS 4** 的个人博客，内容通过 **GitHub App** 直接管理：在前端页面编辑内容，自动提交到 GitHub 仓库并触发部署。

> 原项目：https://github.com/YYsuni/2025-blog-public

## 功能

- **博客** `/blog`：Markdown 写作（`/write`），支持代码高亮（Shiki）、KaTeX 公式、图片上传
- **项目 / 分享 / 友链 / 关于**：`/projects`、`/share`、`/bloggers`、`/about`
- **图片** `/pictures`：相册展示与随机布局
- **小工具**：`/snippets`、`/svgs`、`/image-toolbox`、`/music`、`/clock` 等
- 全站页面右上角带编辑按钮，登录 GitHub App 私钥后即可在线改内容
- 暗色终端风格 UI：等宽字体、网格背景、自定义光标、页面 glitch 转场、悬浮导航

## 技术栈

Next.js 16（Turbopack）· React 19 · TypeScript · Tailwind CSS 4 · Motion · Zustand · SWR · sonner

## 本地开发

```bash
pnpm i
pnpm dev        # http://localhost:2025
pnpm build      # 生产构建
pnpm start      # 启动生产服务
pnpm svg        # 重新生成 svgs 索引
```

## 部署（Vercel）

1. Fork / 导入本仓库到 Vercel，无需额外配置，直接部署
2. 在 GitHub **Developer Settings → New GitHub App** 创建应用：
   - 只需勾选仓库的 **Contents: Write** 权限，关闭 Webhook
   - 创建后生成 **Private Key**（自动下载，务必保管好，不要公开上传）
   - 记录页面的 **App ID**，并只授权安装到当前博客仓库
3. 配置环境变量（也可直接改 `src/consts.ts`）：

```ts
export const GITHUB_CONFIG = {
	OWNER: process.env.NEXT_PUBLIC_GITHUB_OWNER,   // GitHub 用户名
	REPO: process.env.NEXT_PUBLIC_GITHUB_REPO,     // 仓库名
	BRANCH: process.env.NEXT_PUBLIC_GITHUB_BRANCH, // 分支，默认 main
	APP_ID: process.env.NEXT_PUBLIC_GITHUB_APP_ID  // GitHub App ID
}
```

4. 重新部署一次使变量生效（push 代码或手动触发均可）

完成后即可在网站前端直接编辑内容。注意：前端提示保存成功后，需等后台部署完成再刷新页面才能看到更新。

## 目录结构

```
src/
├── app/            # 路由页面（(home) 为首页，其余一目录一路由）
├── components/     # 全局组件（导航、卡片、光标、背景等）
├── layout/         # 全局布局与背景效果
├── hooks/          # 自定义 hooks（页面转场等）
├── lib/            # 工具函数
├── config/         # 站点配置
├── consts.ts       # GitHub App 等常量
└── styles/         # 全局样式与动画
```

首页内容位于 `src/app/(home)/`，每张卡片一个文件（如 `hi-card.tsx`），改哪张卡片就编辑对应文件。

## License

见 [LICENSE](./LICENSE)。
