import { paginationState } from '../../pagination';
import { catalogStyles } from '../../catalog.styles';

/**
 * Prev/Next controls plus the "Página X de Y" indicator (S49).
 *
 * The buttons are native `<button>` elements, so they are already keyboard
 * accessible (Tab to focus, Enter/Space to activate). The component renders
 * nothing for a single page, where there is no navigation to offer.
 */
const Pagination = ({ page, pages, onPrev, onNext }) => {
  if (pages <= 1) return null;

  const { canPrev, canNext, label } = paginationState({ page, pages });

  return (
    <nav aria-label="Paginación" style={catalogStyles.pagination}>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Anterior"
        style={{
          ...catalogStyles.paginationButton,
          ...(!canPrev ? catalogStyles.paginationButtonDisabled : {}),
        }}
      >
        Anterior
      </button>
      <span aria-live="polite" style={catalogStyles.paginationLabel}>
        {label}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Siguiente"
        style={{
          ...catalogStyles.paginationButton,
          ...(!canNext ? catalogStyles.paginationButtonDisabled : {}),
        }}
      >
        Siguiente
      </button>
    </nav>
  );
};

export default Pagination;
