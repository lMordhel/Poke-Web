/**
 * Pagination rules for the catalogue (S49, S50, S51).
 *
 * Pure helpers with no DOM so the rules can be pinned by node:test, the same
 * way the session rules were extracted in T7. The catalogue and the admin
 * table share them, so the "previous/next can never leave the valid range"
 * rule lives in exactly one place.
 */

export const PAGE_SIZE = 12;

/**
 * Normalise a page number into [1, pages], with a floor of one page even for
 * an empty result set, so the label never reads "Página 1 de 0".
 */
const lastPage = (pages) => Math.max(pages, 1);
const clampPage = (page, pages) => Math.min(Math.max(page, 1), lastPage(pages));

/**
 * What the prev/next controls may do for a given position (S49).
 *
 * Returns the clamped page, the disabled flags for both buttons and the exact
 * Spanish label `Página X de Y`.
 */
export function paginationState({ page = 1, pages = 0 } = {}) {
  const current = clampPage(page, pages);
  const last = lastPage(pages);

  return {
    page: current,
    canPrev: current > 1,
    canNext: current < last,
    label: `Página ${current} de ${last}`,
  };
}

/** Next page, never past the last valid page. */
export function nextPage(page, pages) {
  return Math.min(clampPage(page, pages) + 1, lastPage(pages));
}

/**
 * Which page a screen should ask for after the server reported `pages` (S53).
 *
 * Deleting the last row of the last page leaves the current page past the end,
 * so the table falls back to the last page that still has content instead of
 * stranding the user on an empty page.
 */
export function pageForResult({ page = 1, pages = 0 } = {}) {
  const last = lastPage(pages);
  return page > last ? last : Math.min(Math.max(page, 1), last);
}

/** Previous page, never before the first page. */
export function prevPage(page, pages) {
  return Math.max(clampPage(page, pages) - 1, 1);
}

/**
 * Build the query string the catalogue and the admin table send to
 * `GET /products` (S50, S53).
 *
 * `type` is omitted when it is "Todos" or empty, and `search` is omitted when
 * it is blank and trimmed otherwise, so the server only ever receives filters
 * that mean something. Both screens share it so the page size and the search
 * contract live in exactly one place.
 */
export function productsQuery({ page = 1, limit = PAGE_SIZE, type, search } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  if (type && type !== 'Todos') {
    params.set('type', type);
  }

  const term = (search ?? '').trim();
  if (term) {
    params.set('search', term);
  }

  return params.toString();
}
