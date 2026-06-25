import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

export function CreateLayout({
  title,
  subtitle,
  controls,
  preview,
}: {
  title: string;
  subtitle?: string;
  controls: ReactNode;
  preview: ReactNode;
}) {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-6 max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <aside className="rounded-xl border border-border bg-surface p-5 space-y-5 h-fit">
            {controls}
          </aside>
          <section className="rounded-xl border border-border bg-surface min-h-[520px] p-5">
            {preview}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full h-10 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-semibold shadow-[var(--shadow-glow)] hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export function EmptyPreview({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="h-full min-h-[460px] grid place-items-center text-center">
      <div className="max-w-sm space-y-3">
        <div className="mx-auto size-14 rounded-2xl bg-[image:var(--gradient-brand-soft)] border border-border grid place-items-center text-foreground/70">
          {icon}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
