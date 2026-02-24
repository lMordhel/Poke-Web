import React, { useEffect } from 'react';
import { motion as Motion, useMotionValue, useTransform, animate } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const floatVariants = {
  initial: { y: 0, rotate: 0 },
  animate: {
    y: [-8, 8, -8],
    rotate: [0, 1, 0, -1, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const glowVariants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const AnimatedNumber = ({ value, suffix = '' }) => {
  const motionValue = useMotionValue(0);
  const displayValue = useTransform(motionValue, (latest) => Math.round(latest) + suffix);

  useEffect(() => {
    const controls = animate(motionValue, parseInt(value.replace(/\D/g, '')), {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [value, motionValue]);

  return <Motion.span>{displayValue}</Motion.span>;
};

const StatItem = ({ number, label, isRating = false }) => {
  return (
    <Motion.div
      style={homeStyles.stat}
      variants={fadeUpVariants}
    >
      <div style={homeStyles.statNumber}>
        {isRating ? (
          <AnimatedNumber value={number} />
        ) : (
          <AnimatedNumber value={number} />
        )}
      </div>
      <div style={homeStyles.statLabel}>{label}</div>
    </Motion.div>
  );
};

const Home = () => {
  return (
    <div style={homeStyles.container}>
      <Motion.div
        style={homeStyles.heroBackgroundGlow}
        variants={glowVariants}
        initial="initial"
        animate="animate"
      />

      <section style={homeStyles.hero} className="hero-responsive">
        <Motion.div
          style={homeStyles.heroContent}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Motion.div
            style={homeStyles.banner}
            variants={fadeUpVariants}
            className="glass-tag"
          >
            <Sparkles size={16} color="#F59E0B" />
            ¡Nueva colección disponible!
          </Motion.div>

          <Motion.h1
            style={homeStyles.heroTitle}
            variants={fadeUpVariants}
            className="hero-title-responsive"
          >
            Tu tienda <span style={homeStyles.highlight}>favorita</span>
          </Motion.h1>

          <Motion.p
            style={homeStyles.heroDescription}
            variants={fadeUpVariants}
          >
            Descubre nuestra colección exclusiva de peluches de alta calidad.
            Desde los clásicos hasta las últimas generaciones, ¡atrápalos todos!
          </Motion.p>

          <Motion.div
            style={homeStyles.buttonGroup}
            variants={fadeUpVariants}
            className="button-group-responsive"
          >
            <Motion.div
              whileHover={{ y: -4, scale: 1.03, boxShadow: '0 15px 30px -5px rgba(255, 214, 10, 0.5)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Link to="/catalogo" style={homeStyles.primaryButton}>
                Ver Catálogo
                <ArrowRight size={20} />
              </Link>
            </Motion.div>
            <Motion.button
              style={homeStyles.secondaryButton}
              whileHover={{ y: -4, scale: 1.03, backgroundColor: '#000000', color: '#ffffff', boxShadow: '0 15px 25px -5px rgba(0, 0, 0, 0.2)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              Novedades
            </Motion.button>
          </Motion.div>

          <Motion.div
            style={homeStyles.stats}
            variants={fadeUpVariants}
          >
            <StatItem number="150+" label="Productos" />
            <StatItem number="10K+" label="Clientes" />
            <StatItem number="4.9" label="Rating" isRating />
            <Motion.div
              style={homeStyles.stat}
              variants={fadeUpVariants}
            >
              <Star size={24} fill="#FFD700" color="#FFD700" />
            </Motion.div>
          </Motion.div>
        </Motion.div>

        <Motion.div
          className="hero-img-container"
          variants={floatVariants}
          initial="initial"
          animate="animate"
        >
          <Motion.div
            style={homeStyles.heroImage}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Motion.div
              style={homeStyles.bestSellerTag}
              className="glass-tag"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="section-badge-pulse">
                <Flame size={18} fill="#FF6B35" color="#FF6B35" />
              </div>
              <div>
                <div style={homeStyles.bestSellerLabel}>Más vendido</div>
                <div style={homeStyles.bestSellerProduct}>Pikachu Plush</div>
              </div>
            </Motion.div>

            <img
              src={images.fondo1}
              style={homeStyles.image}
              alt="Hero Banner"
            />
          </Motion.div>
        </Motion.div>
      </section>

      <section style={homeStyles.popularSection}>
        <Motion.div
          style={homeStyles.sectionHeader}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={homeStyles.sectionBadge} className="section-badge-pulse">
            <Star size={16} fill="#FFD700" color="#FFD700" />
            Destacados
          </div>
          <h2 style={homeStyles.sectionTitle}>Los más populares</h2>
          <p style={homeStyles.sectionDescription}>
            Nuestros peluches más queridos por los entrenadores Pokémon de todo el mundo.
          </p>
        </Motion.div>

        <Motion.div
          className="products-grid-container"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Motion.div
            style={homeStyles.productsGrid}
            className="products-grid-responsive"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {popularProducts.map((product) => (
              <Motion.div
                key={product.id}
                variants={fadeUpVariants}
              >
                <ProductCard product={product} />
              </Motion.div>
            ))}
          </Motion.div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link to="/catalogo" style={homeStyles.viewAllButton}>
            Ver todo el catálogo
            <ArrowRight size={20} />
          </Link>
        </Motion.div>
      </section>

      <section style={homeStyles.featuresSection} className="features-grid-responsive">
        {features.map((feature, idx) => {
          const IconComponent = feature.icon;
          return (
            <Motion.div
              key={feature.title}
              style={homeStyles.featureCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                delay: idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{
                y: -8,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
              }}
            >
              <Motion.div
                style={homeStyles.featureIcon}
                whileHover={{ scale: 1.1, rotate: 5, backgroundColor: '#FFD600', boxShadow: '0 0 20px rgba(255, 214, 10, 0.6)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <IconComponent size={32} />
              </Motion.div>
              <h3 style={homeStyles.featureTitle}>{feature.title}</h3>
              <p style={homeStyles.featureDescription}>{feature.description}</p>
            </Motion.div>
          );
        })}
      </section>
    </div>
  );
};

export default Home;
