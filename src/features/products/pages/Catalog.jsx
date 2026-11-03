import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import ProductCard from '@/features/products/components/ProductCard/ProductCard';
import Pagination from '../components/Pagination/Pagination';
import '@/shared/styles/responsive.css';
import '@/shared/styles/spinner.css';
import { productService as apiService } from '@/features/products/services/productService';
import { catalogStyles } from '@/features/products/catalog.styles';
import { productsQuery, nextPage, prevPage } from '../pagination';
import { debounce } from '@/shared/utils/debounce';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [types, setTypes] = useState(['Todos']);
  const [selectedType, setSelectedType] = useState('Todos');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // The filter buttons come from the server, but they do not paginate.
  useEffect(() => {
    let cancelled = false;

    const fetchTypes = async () => {
      try {
        const typesData = await apiService.getProductTypes();
        let extractedTypes = ['Todos'];
        if (Array.isArray(typesData?.types)) {
          extractedTypes = typesData.types;
        } else if (Array.isArray(typesData)) {
          extractedTypes = [...extractedTypes, ...typesData];
        }
        if (!cancelled) setTypes([...new Set(extractedTypes)]);
      } catch (err) {
        console.error('Error fetching types:', err);
      }
    };

    fetchTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  // Search is debounced so the server is only queried after 300 ms of
  // inactivity; a new search always returns to page 1 (S50).
  useEffect(() => {
    const handler = debounce((value) => {
      setDebouncedSearch(value.trim());
      setPage(1);
    }, 300);

    handler(searchInput);

    return () => handler.cancel();
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiService.getProducts(
          productsQuery({ page, type: selectedType, search: debouncedSearch })
        );
        if (cancelled) return;

        const list = Array.isArray(data?.products)
          ? apiService.transformProductList(data.products)
          : [];
        setProducts(list);
        setTotal(data?.total ?? list.length);
        setPages(data?.pages ?? 0);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (cancelled) return;
        setError('No se pudieron cargar los productos. Por favor, intenta más tarde.');
        setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [page, selectedType, debouncedSearch]);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setPage(1);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button
            style={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Catálogo de Peluches</h1>
        <p style={styles.subtitle}>
          Explora nuestra colección completa de peluches Pokémon
        </p>

        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar Pokémon..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filters}>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              style={{
                ...styles.filterButton,
                ...(selectedType === type ? styles.filterButtonActive : {}),
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <p style={styles.productCount}>
          Mostrando {total} productos
        </p>
      </div>

      <div style={styles.productsGrid} className="products-grid-responsive">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Pagination
        page={page}
        pages={pages}
        onPrev={() => setPage((p) => prevPage(p, pages))}
        onNext={() => setPage((p) => nextPage(p, pages))}
      />
    </div>
  );
};

const styles = catalogStyles;

export default Catalog;
