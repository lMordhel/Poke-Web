import React from 'react';
import { m as Motion } from 'framer-motion';
import { dashboardStyles } from '@/features/dashboard/dashboard.styles';

const Skeleton = ({ width, height, borderRadius = 12 }) => {
  return (
    <Motion.div
      style={{
        ...dashboardStyles.skeleton,
        width,
        height,
        borderRadius,
      }}
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

export const SkeletonCard = () => (
  <div style={dashboardStyles.skeletonCard}>
    <Skeleton width="100%" height={120} borderRadius={16} />
    <div style={dashboardStyles.skeletonContent}>
      <Skeleton width="60%" height={20} />
      <Skeleton width="40%" height={14} />
    </div>
  </div>
);

export const SkeletonStats = () => (
  <div style={dashboardStyles.statsGrid}>
    {[1, 2, 3, 4].map((i) => (
      <div key={`skeleton-stat-${i}`} style={dashboardStyles.skeletonStatCard}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <div style={dashboardStyles.skeletonStatContent}>
          <Skeleton width={60} height={28} />
          <Skeleton width={80} height={14} />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonOrderRow = () => (
  <div style={dashboardStyles.skeletonOrderRow}>
    <Skeleton width={40} height={40} borderRadius={10} />
    <Skeleton width={120} height={16} />
    <Skeleton width={80} height={14} />
    <Skeleton width={60} height={24} borderRadius={20} />
  </div>
);

export const SkeletonFavorites = () => (
  <div style={dashboardStyles.favoritesGrid}>
    {[1, 2, 3, 4].map((i) => (
      <SkeletonCard key={`skeleton-card-${i}`} />
    ))}
  </div>
);

export default Skeleton;
