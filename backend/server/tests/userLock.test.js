const { withUserLock, pendingLocks } = require('../services/userLock');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

describe('withUserLock', () => {
  test('runs tasks for the same key one after another, in order', async () => {
    const log = [];
    const task = (name, ms) => async () => {
      log.push(`${name} start`);
      await delay(ms);
      log.push(`${name} end`);
      return name;
    };
    const results = await Promise.all([withUserLock('u1', task('a', 20)), withUserLock('u1', task('b', 1))]);
    expect(results).toEqual(['a', 'b']);
    expect(log).toEqual(['a start', 'a end', 'b start', 'b end']);
  });

  test('different keys do not wait for each other', async () => {
    const log = [];
    await Promise.all([
      withUserLock('u1', async () => {
        await delay(20);
        log.push('u1');
      }),
      withUserLock('u2', async () => {
        log.push('u2');
      }),
    ]);
    expect(log).toEqual(['u2', 'u1']);
  });

  test('a failing task does not block the next one, and its error reaches the caller', async () => {
    const first = withUserLock('u3', async () => {
      throw new Error('boom');
    });
    const second = withUserLock('u3', async () => 'ok');
    await expect(first).rejects.toThrow('boom');
    await expect(second).resolves.toBe('ok');
  });

  test('forgets keys once their queue is empty', async () => {
    await withUserLock('u4', async () => {});
    await delay(0);
    expect(pendingLocks()).toBe(0);
  });
});
