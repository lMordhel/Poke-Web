import { ArrowRight, Sparkles, Truck, Shield, Gift, Headphones, Star, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import '../styles/responsive.css';
import images from '../assets/images';
import { homeStyles } from '../styles/homeStyles';

const popularProducts = [
  { id: 1, img: images.pikachupush, name: 'Pikachu Plush', price: '29.99', type: 'Electric', isNew: true },
  { id: 2, img: images.charmanderpush, name: 'Charmander Plush', price: '27.99', type: 'Fire', isNew: false },
  { id: 3, img: images.squirtlepush, name: 'Squirtle Plush', price: '27.99', type: 'Water', isNew: false },
  { id: 4, img: images.bulbasaurpush, name: 'Bulbasaur Plush', price: '27.99', type: 'Grass', isNew: true },
];

const features = [
  {
    icon: Truck,
    title: 'Envío Rápido',
    description: 'Entrega en 24-48 horas a toda la región.',
  },
  {
    icon: Shield,
    title: 'Calidad Premium',
    description: 'Materiales seguros y duraderos para todas las edades.',
  },
  {
    icon: Gift,
    title: 'Empaque Especial',
    description: 'Cada pedido viene en una caja temática Pokémon.',
  },
  {
    icon: Headphones,
    title: 'Soporte 24/7',
    description: 'Nuestro equipo siempre está listo para ayudarte.',
  },
];

const Home = () => {
  return (
    <div style={homeStyles.container}>
      <section style={homeStyles.hero} className="hero-responsive">
        <div style={homeStyles.heroContent}>
          <div style={homeStyles.banner}>
            <Sparkles size={16} />
            ¡Nueva colección disponible!
          </div>
          
          <h1 style={homeStyles.heroTitle} className="hero-title-responsive" >
            Tu tienda <span style={homeStyles.highlight}>favorita</span>
          </h1>
          
          <p style={homeStyles.heroDescription}>
            Descubre nuestra colección exclusiva de peluches de alta calidad. 
            Desde los clásicos hasta las últimas generaciones, ¡atrápalos todos!
          </p>
          
          <div style={homeStyles.buttonGroup} className="button-group-responsive">
            <Link to="/catalogo" style={homeStyles.primaryButton}>
              Ver Catálogo
              <ArrowRight size={20} />
            </Link>
            <button style={homeStyles.secondaryButton}>
              Novedades
            </button>
          </div>
          
          <div style={homeStyles.stats}>
            <div style={homeStyles.stat}>
              <div style={homeStyles.statNumber}>150+</div>
              <div style={homeStyles.statLabel}>Productos</div>
            </div>
            <div style={homeStyles.stat}>
              <div style={homeStyles.statNumber}>10K+</div>
              <div style={homeStyles.statLabel}>Clientes</div>
            </div>
            <div style={homeStyles.stat}>
              <div style={homeStyles.statNumber}>4.9</div>
              <div style={homeStyles.statLabel}>Rating</div>
            </div>
            <div style={homeStyles.stat}>
              <Star size={20} fill="#FFD700" color="#FFD700" gap="1rpm" />
            </div>
          </div>
        </div>

        <div style={homeStyles.heroImage}> 
          <div style={homeStyles.bestSellerTag}>
            <Flame size={12} fill="#FF6B35" color="#FF6B35"/>
            <div>
              <div style={homeStyles.bestSellerLabel}>Más vendido</div>
              <div style={homeStyles.bestSellerProduct}>Pikachu Plush</div>
            </div>
          </div>
          
          <img 
            src={images.fondo1} 
            style={homeStyles.image}
            alt="Hero Banner"
          />
        </div>
      </section>

      <section style={homeStyles.popularSection}>
        <div style={homeStyles.sectionHeader}>
          <div style={homeStyles.sectionBadge}>
            <Star size={16} fill="#FFD700" color="#FFD700" />
            Destacados
          </div>
          <h2 style={homeStyles.sectionTitle}>Los más populares</h2>
          <p style={homeStyles.sectionDescription}>
            Nuestros peluches más queridos por los entrenadores Pokémon de todo el mundo.
          </p>
        </div>
        
        <div style={homeStyles.productsGrid} className="products-grid-responsive">
          {popularProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        <Link to="/catalogo" style={homeStyles.viewAllButton}>
          Ver todo el catálogo
          <ArrowRight size={20} />
        </Link>
      </section>

      <section style={homeStyles.featuresSection} className="features-grid-responsive">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div key={index} style={homeStyles.featureCard}>
              <div style={homeStyles.featureIcon}>
                <IconComponent size={32} />
              </div>
              <h3 style={homeStyles.featureTitle}>{feature.title}</h3>
              <p style={homeStyles.featureDescription}>{feature.description}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default Home;
