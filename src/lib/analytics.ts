/**
 * PostHog analytics — lazily initialised, no-op when key is absent.
 * Set VITE_POSTHOG_KEY (+ optional VITE_POSTHOG_HOST) to enable.
 */
import posthog from 'posthog-js';

let started = false;

export function initAnalytics() {
  if (started || typeof window === 'undefined') return;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;
  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://us.i.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: 'identified_only',
  });
  started = true;
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (!started) return;
  posthog.identify(userId, traits);
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!started) return;
  posthog.capture(event, props);
}

export function reset() { if (started) posthog.reset(); }
