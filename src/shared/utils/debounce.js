/**
 * A small trailing debounce used by the catalogue and admin search boxes.
 *
 * It is deliberately dependency-free and DOM-free so it can be tested with
 * node:test: it only needs `setTimeout` and `clearTimeout`, which both Node
 * and the browser provide.
 */
export function debounce(fn, delay) {
  let timerId = null;

  const debounced = (...args) => {
    if (timerId !== null) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}
