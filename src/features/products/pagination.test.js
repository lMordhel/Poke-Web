/**
 * Pagination rules for the catalogue (S49, S50, S51).
 *
 * The catalogue used to fetch every product and filter in memory. Now the
 * server owns both the slicing and the filtering, so the component needs three
 * things from a pure module: how many products a page holds, how to build the
 * query it sends, and what the previous/next controls may do (S49, S50).
 *
 * Extracted from the component so the rules can be tested without a DOM, the
 * same way the session rules were extracted in T7.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PAGE_SIZE,
  productsQuery,
  paginationState,
  nextPage,
  prevPage,
} from './pagination.js';

test('one page holds twelve products', () => {
  assert.equal(PAGE_SIZE, 12);
});

test('the first page can only move forward', () => {
  const state = paginationState({ page: 1, pages: 3 });

  assert.equal(state.canPrev, false);
  assert.equal(state.canNext, true);
  assert.equal(state.label, 'Página 1 de 3');
});

test('the last page can only move back', () => {
  const state = paginationState({ page: 3, pages: 3 });

  assert.equal(state.canPrev, true);
  assert.equal(state.canNext, false);
  assert.equal(state.label, 'Página 3 de 3');
});

test('a single page has both controls disabled', () => {
  const state = paginationState({ page: 1, pages: 1 });

  assert.equal(state.canPrev, false);
  assert.equal(state.canNext, false);
  assert.equal(state.label, 'Página 1 de 1');
});

test('an empty result set still shows page one of one', () => {
  const state = paginationState({ page: 1, pages: 0 });

  assert.equal(state.canPrev, false);
  assert.equal(state.canNext, false);
  assert.equal(state.label, 'Página 1 de 1');
});

test('a page beyond the end is clamped to the last page', () => {
  const state = paginationState({ page: 9, pages: 3 });

  assert.equal(state.page, 3);
  assert.equal(state.canNext, false);
});

test('next and prev never leave the valid range', () => {
  assert.equal(nextPage(1, 3), 2);
  assert.equal(nextPage(3, 3), 3);
  assert.equal(prevPage(2, 3), 1);
  assert.equal(prevPage(1, 3), 1);
});

test('the query always carries the page and the page size', () => {
  const query = new URLSearchParams(productsQuery());

  assert.equal(query.get('page'), '1');
  assert.equal(query.get('limit'), String(PAGE_SIZE));
  assert.equal(query.get('type'), null);
  assert.equal(query.get('search'), null);
});

test('the selected type travels to the server', () => {
  const query = new URLSearchParams(productsQuery({ page: 2, type: 'Fire' }));

  assert.equal(query.get('type'), 'Fire');
  assert.equal(query.get('page'), '2');
});

test('the "all types" option is not sent as a filter', () => {
  const query = new URLSearchParams(productsQuery({ type: 'Todos' }));

  assert.equal(query.get('type'), null);
});

test('the search term travels to the server, trimmed and intact', () => {
  const query = new URLSearchParams(productsQuery({ search: '  pika (fire)  ' }));

  assert.equal(query.get('search'), 'pika (fire)');
});

test('a blank search is not sent as a filter', () => {
  const query = new URLSearchParams(productsQuery({ search: '   ' }));

  assert.equal(query.get('search'), null);
});
