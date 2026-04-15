import React from 'react';

// Skeleton card that mimics the shape of a ProductCard
const SkeletonCard = () => (
  <div className="p-4 flex flex-col animate-pulse">
    <div className="skeleton w-full h-[180px] mb-4 rounded"></div>
    <div className="skeleton h-3 w-3/5 mb-2 rounded"></div>
    <div className="skeleton h-4 w-full mb-1.5 rounded"></div>
    <div className="skeleton h-4 w-4/5 mb-3 rounded"></div>
    <div className="flex items-center gap-2 mb-3">
      <div className="skeleton h-5 w-10 rounded"></div>
      <div className="skeleton h-3 w-12 rounded"></div>
    </div>
    <div className="flex items-center gap-2">
      <div className="skeleton h-5 w-20 rounded"></div>
      <div className="skeleton h-4 w-14 rounded"></div>
      <div className="skeleton h-4 w-16 rounded"></div>
    </div>
  </div>
);

const Loader = ({ count = 10, type = 'grid' }) => {
  if (type === 'spinner') {
    return (
      <div className="flex justify-center items-center h-full w-full py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-flipkartBlue"></div>
      </div>
    );
  }

  // Grid skeleton — matches the product listing grid
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 divide-x divide-y border-t border-l">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-b border-r bg-white">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
};

export default Loader;
