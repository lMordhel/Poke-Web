import { useReducer, useEffect } from 'react';
import { Search } from 'lucide-react';
import ProductCard from '@/features/products/components/ProductCard/ProductCard';
import '@/shared/styles/responsive.css';
import '@/shared/styles/spinner.css';
import { productService as apiService } from '@/features/products/services/productService';
import { catalogStyles } from '@/features/products/catalog.styles';

const initialState = {
  products: [],
  types: ['Todos'],
  selectedType: 'Todos',
  searchQuery: '',
  loading: true,
  error: null
};

function catalogReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        products: action.payload.products,
        types: action.payload.types,
        loading: false
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        error: action.payload,
        products: [],
        types: ['Todos'],
        loading: false
      };
    case 'SET_FILTER':
      return { ...state, selectedType: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
}

const Catalog = () => {
  const [state, dispatch] = useReducer(catalogReducer, initialState);
  const { products, types, selectedType, searchQuery, loading, error } = state;

  // Fetch products and types from API
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_START' });
      try {
        // Fetch products
        const productsData = await apiService.getProducts();
        console.log('Products API response:', productsData); // Debug log

        let transformedProducts = [];
        if (productsData && Array.isArray(productsData.products)) {
          transformedProducts = apiService.transformProductList(productsData.products);
        } else if (Array.isArray(productsData)) {
          // Fallback if API returns array directly
          transformedProducts = apiService.transformProductList(productsData);
        } else {
          console.warn('Unexpected products data structure:', productsData);
        }

        // Fetch types
        const typesData = await apiService.getProductTypes();
        let extractedTypes = ['Todos'];
        if (typesData && Array.isArray(typesData.types)) {
          extractedTypes = typesData.types;
        } else if (Array.isArray(typesData)) {
          extractedTypes = extractedTypes.concat(typesData);
        } else {
          console.warn('Unexpected types data structure:', typesData);
        }

        // Remove duplicate 'Todos' if any
        extractedTypes = [...new Set(extractedTypes)];

        dispatch({
          type: 'FETCH_SUCCESS',
          payload: { products: transformedProducts, types: extractedTypes }
        });

      } catch (err) {
        console.error('Error fetching data:', err);
        dispatch({
          type: 'FETCH_ERROR',
          payload: 'No se pudieron cargar los productos. Por favor, intenta más tarde.'
        });
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesType = selectedType === 'Todos' || product.type === selectedType;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

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
            value={searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filters}>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => dispatch({ type: 'SET_FILTER', payload: type })}
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
          Mostrando {filteredProducts.length} productos
        </p>
      </div>

      <div style={styles.productsGrid} className="products-grid-responsive">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

const styles = catalogStyles;

export default Catalog;
