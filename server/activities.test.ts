import { describe, expect, it } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

// Mock context for public procedures (no user required)
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: () => {},
    } as TrpcContext['res'],
  };
}

describe('activities router', () => {
  it('lists activities successfully', async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.activities.list();

    expect(Array.isArray(result)).toBe(true);
    // Result should be an array of activities with enriched data
    if (result.length > 0) {
      const activity = result[0];
      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('placeName');
      expect(activity).toHaveProperty('date');
      expect(activity).toHaveProperty('roughTime');
      expect(activity).toHaveProperty('proposerUsername');
      expect(activity).toHaveProperty('participantCount');
      expect(activity).toHaveProperty('participantNames');
      expect(activity).toHaveProperty('commentCount');
    }
  });

  it('creates a new activity', async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.activities.create({
      placeName: 'Test Beach',
      date: '2026-07-15',
      roughTime: '3:00 PM',
      description: 'Test activity',
      proposerUsername: 'TestUser',
    });

    expect(result).toBeDefined();
    // Drizzle returns a result object
    expect(typeof result === 'object').toBe(true);
  });

  it('validates required activity fields', async () => {
    const caller = appRouter.createCaller(createPublicContext());
    
    try {
      await caller.activities.create({
        placeName: '',
        date: '2026-07-15',
        roughTime: '3:00 PM',
        proposerUsername: 'TestUser',
      });
      expect.fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.message).toContain('Too small');
    }
  });

  it('validates participant input', async () => {
    const caller = appRouter.createCaller(createPublicContext());
    
    try {
      await caller.participants.add({
        activityId: 999,
        username: '',
      });
      expect.fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.message).toContain('Too small');
    }
  });

  it('validates comment input', async () => {
    const caller = appRouter.createCaller(createPublicContext());
    
    try {
      await caller.comments.add({
        activityId: 999,
        username: 'TestUser',
        content: '',
      });
      expect.fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.message).toContain('Too small');
    }
  });
});
