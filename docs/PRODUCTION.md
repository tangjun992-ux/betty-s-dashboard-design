# Betty — Production Readiness Guide

> Stack reality: Betty ships on **Lovable** (frontend hosting + Cloudflare Worker SSR) and **Lovable Cloud** (Supabase Postgres + Auth + Storage). The Vercel/raw-Supabase recipes below are kept for reference if you self-host later.

---

## 1. Testing strategy

| Layer | Tool | Run | Scope |
|---|---|---|---|
| Unit | Vitest | `bun x vitest run` | Pure helpers (`credits.server`, `model-registry`, validators) |
| Component | Vitest + Testing Library | same | Buttons, forms, modal flows in isolation |
| E2E | Playwright | `bun x playwright test` | Public routes, auth redirects, smoke flows |
| Manual | Checklist below | Every release | Paid flows that hit real Stripe/fal.ai |

### Manual release checklist

**Auth**
- [ ] Email + password sign-up creates `profiles` and `user_roles` rows
- [ ] Google OAuth via `lovable.auth.signInWithOAuth` lands back on intended route
- [ ] Sign-out clears JobsTray + cached queries

**Credits & generation**
- [ ] Image / video / lipsync / motion / bg-remove all charge correct amount (see `model-registry.ts`)
- [ ] Insufficient balance → friendly error, no `generations` row written
- [ ] Cancel mid-run → status `canceled`, ledger shows refund, profile balance restored
- [ ] fal.ai timeout / 5xx → status `failed`, automatic refund, toast surfaced

**Payments (sandbox)**
- [ ] Card `4242 4242 4242 4242` completes embedded checkout
- [ ] Webhook writes `subscriptions` row with correct `environment='sandbox'`
- [ ] `invoice.paid` grants `CREDIT_GRANTS[priceId]` exactly once (replay same event → no double grant)
- [ ] Prorated upgrade fires immediate invoice; `price_id` updates
- [ ] Cancel at period end → access until `current_period_end`, then `canceled`

**Realtime / UI**
- [ ] JobsTray badge updates across tabs
- [ ] Library invalidates on new generation
- [ ] `/admin/webhooks` lists `stripe_events` rows

---

## 2. Error handling

- **Global boundary**: wrap `<RouterProvider>` (or each top-level outlet) in `src/components/ErrorBoundary.tsx`. Forwards to `posthog.captureException` and `Sentry.captureException` when present.
- **Per-route**: every `createFileRoute` with a loader sets `errorComponent` + `notFoundComponent`; the root sets `defaultErrorComponent`.
- **Toasts**: use `sonner` with stable IDs (see Explore feed pattern) to dedupe spam.
- **Server fns**: never let a Stripe / fal.ai exception escape — catch and return `{ error: msg }`, the client throws the message. This bypasses TanStack's generic-500 middleware.
- **Sentry (optional)**: `bun add @sentry/react` then in `src/main.tsx` call `Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, tracesSampleRate: 0.1 })`. Already wired through the boundary.

---

## 3. Performance

- TanStack Router auto-code-splits route components; do **not** `export` route components.
- Loader-level data: `context.queryClient.ensureQueryData(opts)` + `useSuspenseQuery` on the component.
- Heavy 3rd-party widgets (Stripe checkout, editor canvas): keep behind `useState` toggle, mount on demand.
- LCP image: preload via `head().links` on the route that owns it.
- Realtime: one subscription per user scope; avoid per-card channels.
- DB: composite indexes already present — `gen_user_created_idx`, `assets_user_kind_idx`, `credits_ledger.idempotency_key`.

---

## 4. Deployment

### Lovable (current)
1. Click **Publish** in the editor (frontend changes). Server functions + migrations deploy automatically.
2. Stripe sandbox webhook is auto-registered. Live webhook auto-registers after go-live in Lovable Project Settings → Payments.
3. Custom domain: **Project Settings → Domains**. SSL is automatic.
4. Runtime env vars: managed via Lovable secrets — see `<secrets>` panel.

### Self-hosting fallback
- Frontend: Vercel / Cloudflare Pages — `bun run build`, output `.output/`.
- DB: Supabase project; run migrations via `supabase db push`.
- Required env (server): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `STRIPE_SANDBOX_API_KEY`, `STRIPE_LIVE_API_KEY`, `PAYMENTS_*_WEBHOOK_SECRET`, `FAL_KEY`, `REPLICATE_API_TOKEN`, `LOVABLE_API_KEY`.
- Required env (client): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_PAYMENTS_CLIENT_TOKEN`, `VITE_POSTHOG_KEY` (optional), `VITE_SENTRY_DSN` (optional).
- HTTPS: enforce HSTS, redirect bare → www (or reverse), CAA record for Let's Encrypt.

---

## 5. Monitoring & logs

- **PostHog**: `initAnalytics()` from `src/lib/analytics.ts` in `__root.tsx` `useEffect`. Track `generation_started`, `checkout_opened`, `plan_changed`.
- **Server logs**: `supabase--edge_function_logs` + TanStack server-fn logs via Lovable dashboard.
- **Webhook health**: `/admin/webhooks` page (already built) — confirm `stripe_events` cardinality matches Stripe dashboard.
- **DB health**: `supabase--db_health` weekly; watch slow queries on `generations`.

---

## 6. Security audit

| Area | Status |
|---|---|
| Webhook HMAC + timestamp ≤300s + dedupe | ✅ `verifyWebhook` + `stripe_events` |
| RLS on every user table | ✅ scoped to `auth.uid()` |
| `service_role` only in `client.server.ts`, loaded inside handlers | ✅ |
| Roles in separate `user_roles` table + `has_role()` SECURITY DEFINER | ✅ |
| HIBP password check | ✅ enabled |
| Atomic credit consume with `FOR UPDATE` | ✅ `consume_credits` RPC |
| Input validation (Zod) on all server fns | ⚠️ partial — extend to all `*.functions.ts` |
| Rate limiting on payments / generation fns | ⚠️ recommended — add Upstash KV or pg-based token bucket before public launch |
| File upload size + MIME validation | ✅ enforced in `use-uploader.ts` |
| OAuth `redirect_uri` is public same-origin URL | ✅ |

---

## 7. Scale & expansion

- **Teams**: add `organizations` + `org_members(org_id, user_id, role)`, replace `user_id` filters with `org_id` where needed, gate via `has_org_role()` RPC.
- **i18n**: `bun add i18next react-i18next`; locale files in `src/locales/{en,zh,ja}.json`; persist preference on `profiles.locale`.
- **Multilingual prompts**: store user's preferred prompting language on profile; auto-translate via Lovable AI Gateway (`google/gemini-2.5-flash`) before submitting to image/video models that perform better in English.
- **Queue scale**: if QPS > ~50/s, move polling to `/api/public/jobs/tick` invoked by pg_cron every 5s.

---

## Commands

```bash
bun x vitest run              # unit + component
bun x vitest --ui             # interactive
bun x playwright install      # one-time, downloads browser
bun x playwright test         # e2e against localhost:8080
bun x playwright test --ui    # interactive
```
