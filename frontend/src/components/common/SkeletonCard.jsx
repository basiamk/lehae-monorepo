import React from 'react';

// Single skeleton card — mimics the shape of PropertyCard
const SkeletonCard = () => (
  <div style={{
    background: '#fff',
    border: '1px solid #ede8e0',
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  }}>
    <style>{`
      @keyframes shimmer {
        0%   { background-position: -600px 0; }
        100% { background-position:  600px 0; }
      }
      .sk {
        background: linear-gradient(90deg, #f5f0e8 25%, #ede8e0 50%, #f5f0e8 75%);
        background-size: 600px 100%;
        animation: shimmer 1.4s infinite linear;
        border-radius: 6px;
      }
    `}</style>

    {/* Image placeholder */}
    <div className="sk" style={{ height: 210 }} />

    {/* Body */}
    <div style={{ padding: '18px 18px 16px' }}>
      {/* Location row */}
      <div className="sk" style={{ height: 10, width: 80, marginBottom: 10 }} />
      {/* Title */}
      <div className="sk" style={{ height: 18, width: '75%', marginBottom: 8 }} />
      {/* Deposit pill */}
      <div className="sk" style={{ height: 22, width: 120, borderRadius: 100, marginBottom: 12 }} />
      {/* Description lines */}
      <div className="sk" style={{ height: 11, width: '100%', marginBottom: 6 }} />
      <div className="sk" style={{ height: 11, width: '65%', marginBottom: 18 }} />
      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3ede6', paddingTop: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sk" style={{ width: 26, height: 26, borderRadius: '50%' }} />
          <div className="sk" style={{ width: 70, height: 10 }} />
        </div>
        <div className="sk" style={{ width: 60, height: 30, borderRadius: 100 }} />
      </div>
    </div>
  </div>
);

// Grid of skeleton cards — use this instead of <LoadingSpinner> on list pages
const SkeletonGrid = ({ count = 6 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 24,
  }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export { SkeletonCard, SkeletonGrid };
export default SkeletonGrid;