# Betty 全站克隆计划

完整 clone Yapper 体量非常大，会按以下阶段交付。每个阶段完成后你可验收，再继续下一阶段。

## 阶段 1：视觉重构 + 站点骨架（本次交付）

把现有 pink/magenta 配色换成 Yapper 蓝紫色调，并搭建完整的多页路由结构。

**配色 / 主题**
- 背景 `#0B0B0F`、面板 `#15151B`、边框 `#23232C`
- 主色蓝 `#6366F1` → 紫 `#A855F7` 渐变 (Yapper 原版)
- 字体：Inter（已默认）

**路由结构（TanStack file-based）**
- `/` Home / Dashboard
- `/explore` 创作者作品瀑布流
- `/library` My Library
- `/sessions` 历史会话
- `/tools` 全部工具
- `/earn` 创作者活动
- `/create/video`、`/create/image`、`/create/lipsync`、`/create/motion`、`/create/avatar`、`/create/audio`、`/create/agent`、`/create/upscale`、`/create/extract` 各生成器页面（统一布局：左侧参数表单 + 右侧预览/历史）
- `/auth` 登录注册
- `/settings` 账户与计费

**共享组件**
- `AppSidebar`（更新配色 + 所有导航项 + 折叠态）
- `TopBar`（搜索、积分、头像菜单）
- `CreateLayout`（双栏生成器壳）
- `MediaCard`、`ToolPill`、`SectionHeader`（保留并改色）

## 阶段 2：Lovable Cloud 登录与持久化

- 启用 Lovable Cloud
- 邮箱密码 + Google 登录
- 表：`profiles`、`user_roles`、`generations`（保存所有 AI 生成记录）、`sessions`、`library_items`
- RLS、`has_role` 函数等按规范配置
- `/library`、`/sessions` 显示真实数据
- 顶栏显示用户、登出

## 阶段 3：真实 AI 生成（Lovable AI Gateway）

按优先级接入：
1. **Image Generation** (`/create/image`) - `openai/gpt-image-2` 流式 + 部分预览
2. **Agent / Prompt enhance** (`/create/agent`) - `google/gemini-3-flash-preview` 流式聊天
3. **Audio TTS** (`/create/audio`) - `openai/gpt-4o-mini-tts`
4. **Image Editor** - `google/gemini-3.1-flash-image`

每次生成写入 `generations` 表，自动出现在 My Library。

## 阶段 4（可选，需第三方密钥）

视频 / Lipsync / Motion Control / Talking Avatar 需要外部 API（如 fal.ai、Replicate、ElevenLabs），费用由你的密钥承担。完成阶段 3 后再单独沟通要不要接、用哪家。

## 本次（阶段 1）将改动的文件

- `src/styles.css` - 改 token 为蓝紫深色调
- `src/components/AppSidebar.tsx` - 重做品牌色 + 路由项
- 新增 `src/components/TopBar.tsx`
- 新增 `src/components/dashboard/CreateLayout.tsx`
- `src/routes/index.tsx` - 改配色，加 TopBar
- 新建：`explore.tsx`、`library.tsx`、`sessions.tsx`、`tools.tsx`、`earn.tsx`、`settings.tsx`、`auth.tsx`、`create.tsx`（layout）、`create.video.tsx`、`create.image.tsx`、`create.lipsync.tsx`、`create.motion.tsx`、`create.avatar.tsx`、`create.audio.tsx`、`create.agent.tsx`、`create.upscale.tsx`、`create.extract.tsx`

预计阶段 1 之后界面已经完整可点、所有页面都有真实内容布局（含示例占位数据），可作为后续真实功能的载体。

确认后我开始阶段 1。
