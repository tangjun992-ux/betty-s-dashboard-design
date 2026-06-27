import { describe, it, expect, vi } from 'vitest';
import { consumeCredits, refundCredits } from './credits.server';

function mockSupabase(rpcImpl: (name: string, args: any) => any) {
  return { rpc: vi.fn((name: string, args: any) => Promise.resolve(rpcImpl(name, args))) } as any;
}

describe('credits.server', () => {
  it('consumeCredits returns new balance on success', async () => {
    const sb = mockSupabase(() => ({ data: 100, error: null }));
    const bal = await consumeCredits(sb, { userId: 'u', amount: 5, reason: 'image' });
    expect(bal).toBe(100);
    expect(sb.rpc).toHaveBeenCalledWith('consume_credits', expect.objectContaining({ _amount: 5 }));
  });

  it('consumeCredits maps insufficient_credits to a friendly error', async () => {
    const sb = mockSupabase(() => ({ data: null, error: { message: 'insufficient_credits' } }));
    await expect(consumeCredits(sb, { userId: 'u', amount: 50, reason: 'video' }))
      .rejects.toThrow(/upgrade or top up/);
  });

  it('refundCredits passes idempotency key', async () => {
    const sb = mockSupabase(() => ({ data: 42, error: null }));
    const bal = await refundCredits(sb, { userId: 'u', amount: 3, reason: 'refund', idem: 'k1' });
    expect(bal).toBe(42);
    expect(sb.rpc).toHaveBeenCalledWith('refund_credits', expect.objectContaining({ _idem: 'k1' }));
  });
});
