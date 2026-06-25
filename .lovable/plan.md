# Betty 全量 Clone 交付计划

我将按以下顺序连续执行所有阶段，不再每步确认。仅在以下情况会停下：
- 需要你提供外部 API Key（fal.ai / Replicate / Google OAuth）
- 出现需要你拍板的方向性抉择（例如付费方案是否真接 Stripe）

执行时每完成一个阶段会简短汇报，然后立即进入下一阶段。

---

## Phase 1 — Explore 页收尾（进行中，本轮收尾）
- 卡片点击 / Enter 打开右侧详情 Drawer（已接入）
- Avatars / Audio 空状态占位
- URL ↔ filter/sort 双向同步（已接入）
- 键盘可达性（filter bar 方向键，已接入）
- 详情 Drawer 的 Recreate / Reuse / Download / Share 跳转

## Phase 2 — 全站布局与导航完善
- TopBar：积分余额、通知、头像菜单、面包屑
- Sidebar：折叠态、Active 高亮动画、底部用户卡
- 命令面板 ⌘K（路由跳转 + 工具搜索 + 最近会话）
- 全局快捷键（G+H 回首页 / G+E Explore / N 新建）
- 全局 404、Loading、Error 边界统一化

## Phase 3 — Lovable Cloud 与认证
- 启用 Lovable Cloud
- Email / Google 登录 + 注册 + 找回密码
- `profiles` 表 + 注册触发器自动建档
- `_authenticated` 路由守卫，未登录跳 `/auth`
- 顶栏头像菜单接真实 session

## Phase 4 — 数据建模
- 表：`generations`、`sessions`、`session_messages`、`likes`、`follows`、`assets`、`credits_ledger`、`user_roles`
- 全部 RLS + GRANT，`has_role` security definer
- Storage bucket：`generations`（公开读、作者写）
- 索引与外键，分页用 cursor

## Phase 5 — 真实 AI 生成（Lovable AI Gateway）
- Image：GPT-Image / Gemini Flash Image
- Chat Agent：流式输出 + 会话持久化
- Prompt enhancer 服务函数
- 生成结果落 `generations` + Storage，扣 credits

## Phase 6 — 外部视频 / 音频 API
- fal.ai（或 Replicate）：Video、Lipsync、Motion、Upscale
- 异步任务：`jobs` 表 + 轮询 / webhook
- 生成中卡片占位、进度、失败重试
- 需要时会向你索取 API Key

## Phase 7 — 积分与活动
- Credits 账本 + 每日签到
- Earn 页：任务列表、推荐人、排行榜
- 生成前余额校验、不足引导充值
- 充值入口预留（Stripe 占位，真接需你确认）

## Phase 8 — 真社交 Feed
- Explore 切到真实 DB，保留现有 cursor / 防抖 / 缓存 / toast
- Like / Follow / Comment / Share
- 用户主页 `/u/$handle`：作品瀑布流 + 关注按钮
- My Library / Sessions 全部接真实数据

## Phase 9 — 账户与设置
- Settings：Profile、Appearance（主题切换）、Notifications、API Keys、Billing
- 头像上传 + 裁剪
- 删除账号 / 导出数据

## Phase 10 — 上线就绪
- 每个路由独立 SEO（title / meta / og / twitter / JSON-LD）
- 图片 lazy + responsive、路由 prefetch、字体子集
- 安全扫描修复、RLS 审计
- 404 / robots / sitemap
- 发布

---

## 技术说明（供参考）
- 路由：TanStack Start file-based，`/_authenticated/*` 守卫
- 数据读取：loader `ensureQueryData` + 组件 `useSuspenseQuery`
- 服务端：`createServerFn` + `requireSupabaseAuth`，外部 API 调用走服务函数
- 长任务：`jobs` 表 + 5s 轮询，后续可换 SSE
- 文件：Cloud Storage `generations` bucket，按 `userId/yyyymm/` 分目录

我现在直接开始 Phase 1 收尾，然后无缝进入 Phase 2。Phase 6 抵达时会停下来向你要 fal.ai / Replicate Key。