import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import '../styles/responsive.css';
import '../styles/spinner.css';
import apiService from '../services/apiService';
import { catalogStyles } from '../styles/catalogStyles';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [types, setTypes] = useState(['Todos']);
  const [selectedType, setSelectedType] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products and types from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

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

        setProducts(transformedProducts);

        // Fetch types
        const typesData = await apiService.getProductTypes();
        if (typesData && Array.isArray(typesData.types)) {
          setTypes(typesData.types);
        } else if (Array.isArray(typesData)) {
          setTypes(typesData);
        } else {
          setTypes(['Todos']);
          console.warn('Unexpected types data structure:', typesData);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('No se pudieron cargar los productos. Por favor, intenta más tarde.');

        // Fallback to empty arrays
        setProducts([]);
        setTypes(['Todos']);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products based on type and search
  useEffect(() => {
    const filtered = products.filter((product) => {
      const matchesType = selectedType === 'Todos' || product.type === selectedType;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });

    setFilteredProducts(filtered);
  }, [products, selectedType, searchQuery]);

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
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filters}>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
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
