import { test } from 'node:test';
import assert from 'node:assert/strict';

import { debounce } from './debounce.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('debounce waits for the quiet period before running the function', async () => {
  const calls = [];
  const debounced = debounce((value) => calls.push(value), 30);

  debounced('a');
  debounced('b');
  debounced('c');

  assert.deepEqual(calls, []);
  await wait(20);
  assert.deepEqual(calls, []);
  await wait(15);
  assert.deepEqual(calls, ['c']);
});

test('each new call restarts the quiet period', async () => {
  const calls = [];
  const debounced = debounce((value) => calls.push(value), 40);

  debounced('a');
  await wait(20);
  debounced('b');
  await wait(20);
  assert.deepEqual(calls, []);
  await wait(25);
  assert.deepEqual(calls, ['b']);
});

test('cancel drops a pending call', async () => {
  const calls = [];
  const debounced = debounce(() => calls.push('run'), 30);

  debounced();
  debounced.cancel();
  await wait(50);
  assert.deepEqual(calls, []);
});
