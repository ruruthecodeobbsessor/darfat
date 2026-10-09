import assert from 'node:assert/strict';
import net from 'node:net';
import { test } from 'node:test';

test('missing database configuration fails immediately instead of connecting to localhost', async () => {
  const saved = { DATABASE_URL: process.env.DATABASE_URL, SUPABASE_DB_URL: process.env.SUPABASE_DB_URL };
  delete process.env.DATABASE_URL;
  delete process.env.SUPABASE_DB_URL;
  try {
    const { query } = await import('../lib/db.js?missing');
    await assert.rejects(query('select 1'), /DATABASE_URL is not configured/);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('an unresponsive database connection times out instead of hanging', { timeout: 15000 }, async () => {
  const sockets = new Set();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.resume();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `postgresql://test:test@127.0.0.1:${server.address().port}/test`;
  try {
    const { query } = await import('../lib/db.js?timeout');
    const started = Date.now();
    await assert.rejects(query('select 1'), /timeout/i);
    assert.ok(Date.now() - started < 14000);
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => server.close(resolve));
  }
});
