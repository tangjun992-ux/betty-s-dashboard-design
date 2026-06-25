# Betty (Yapper.so) 完整克隆 — 全量交付计划

目标：把 Betty 做成 Yapper.so 的功能 + 像素级克隆，包含登录、数据持久化、真实 AI 生成。我会按下面顺序逐阶段执行，每个阶段做完自验后直接进入下一阶段，无需你逐条确认。

---

## Phase 1 — Explore 收尾打磨（继续当前工作）
- 键盘可访问性：filter/sort 支持方向键 + Enter；卡片支持 Enter 打开详情
- 详情抽屉/模态：点击卡片打开右侧 Drawer，展示大图、prompt、模型、Recreate/Reuse/Download
- URL 同步：filter/sort/cursor 写入 search params，刷新或分享可还原
- 空态：Avatars / Audio 筛选下的空状态插画 + CTA

## Phase 2 — 全站布局与导航对齐 Yapper
- 顶部右侧：积分余额、通知铃铛、用户菜单（dropdown）
- Sidebar：折叠/展开、Tools 子菜单、当前路由高亮、Tooltip on collapsed
- Command Palette（⌘K）：跨页搜索路由、工具、最近作品
- 全局快捷键：g+h 首页、g+e Explore、g+l Library、n 新建会话
- 404 / 错误边界统一样式

## Phase 3 — Lovable Cloud 接入 + Auth
- 启用 Lovable Cloud
- /auth：Email 注册/登录、Google OAuth、忘记密码
- `_authenticated` 路由组 + 中间件
- `profiles` 表（id, display_name, avatar_url, credits, created_at）+ trigger 自动建档
- 顶栏用户菜单接真用户：登出、Settings 跳转

## Phase 4 — 数据模型与持久化
- 表：`generations`、`sessions`、`session_messages`、`likes`、`follows`、`tags`
- 全部 RLS + GRANT；roles 用独立 `user_roles` + `has_role` SECURITY DEFINER
- Storage bucket：`generations`（公开读）、`uploads`（用户私有）
- My Library / Sessions / Likes 从假数据切换到真实查询（TanStack Query loader 模式）

## Phase 5 — Create 工具：真实 AI 生成（Lovable AI Gateway）
- 通用 generator shell：左侧参数表单 + 右侧结果网格 + 历史
- Image Generation：`google/gemini-2.5-flash-image-preview`（含编辑/参考图）
- Chat Agent：`google/gemini-2.5-flash` 流式 SSE，工具调用触发图像/视频生成
- Prompt Enhancer / Extract Prompt：文本模型
- 所有生成入 `generations` 表 + Storage；扣减积分（事务）

## Phase 6 — Create 工具：外部 API（视频/语音/特效）
- 接入 fal.ai（或 Replicate）做：Video（Seedance/Kling/Veo 占位 → 实际可用模型）、Lipsync、Motion Transfer、Upscale、Avatar
- Audio：TTS via AI Gateway
- 异步任务：DB `jobs` 表 + 轮询 / Realtime 订阅进度条
- Webhook：`/api/public/fal-webhook` 验签后回写 job 状态

## Phase 7 — Earn / Credits / 排行榜
- `credit_ledger` 表（来源：注册赠送、每日签到、被点赞、邀请、付费充值占位）
- Earn 页：任务列表、每日签到按钮、邀请码
- 排行榜：周榜/月榜 SQL view
- 顶栏积分实时更新（Realtime）

## Phase 8 — Explore 接真数据 + 社交
- Explore feed 从 `generations` 公开作品中分页（cursor = created_at + id）
- Like / Follow / Comment（最小化）
- 作者主页 `/u/$handle`
- 详情页 `/p/$id`，可分享，OG 图取生成图

## Phase 9 — Settings / Profile / Billing 占位
- Settings：profile、appearance、language、API keys、删除账户
- Billing：套餐展示 + Stripe 占位（按需启用）

## Phase 10 — 质量与上线
- SEO：每个路由独立 title/description/OG/Twitter，sitemap.xml
- 响应式：移动端 sidebar 抽屉、瀑布流降列
- 性能：图片 srcset、骨架统一、路由级 code split
- 安全扫描 + RLS 复核
- 发布预览，给你确认上线

---

## Technical Notes (供我自己执行)
- 路由继续 `src/routes/*` 扁平点号；受保护页放 `_authenticated`
- 服务端逻辑用 `createServerFn`（`*.functions.ts`），webhook 用 `src/routes/api/public/*`
- 数据读取统一 `ensureQueryData` + `useSuspenseQuery`
- AI Gateway key 由 Cloud 注入，禁止前端调用
- 任何新建 public 表立刻写 GRANT + RLS + 策略

## 执行节奏
- 每个 Phase 完成后：自验 → 简短汇报 → 立即开始下一 Phase
- 只在以下情况才暂停问你：① 需要外部 API key（如 fal.ai）② 出现产品方向二选一 ③ 需要你提供素材/文案
- 预计 Phase 1–4 较快，Phase 5–6 最重（真实生成 + 异步任务）