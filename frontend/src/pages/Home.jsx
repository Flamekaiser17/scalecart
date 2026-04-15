import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { useSearchParams } from 'react-router-dom';

// Modern Flipkart-style Banner Groups (3 images per slide on desktop)
const BANNER_GROUPS = [
  [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop', // Headphones
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop', // Shoes
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop'  // Smartwatch
  ],
  [
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=600&auto=format&fit=crop', // Camera
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop', // Fashion Women
    'https://images.unsplash.com/photo-1502920901399-4c8d76dbd8ff?q=80&w=600&auto=format&fit=crop'  // Laptop / Desk
  ]
];

const Home = ({ searchQuery = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Real DB category ID binding
  const [dbCategoryId, setDbCategoryId] = useState('');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(i => (i + 1) % BANNER_GROUPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch db categories to map URL strings (like "laptops") to Mongo ObjectIDs
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res.data || []);
      } catch (err) {
        console.log('Failed to fetch categories:', err.message);
      }
    };
    fetchCategories();
  }, []);

  // Map URL string category to DB category ID
  useEffect(() => {
    if (!urlCategory) {
      setDbCategoryId('');
    } else {
      // Find matching category ID. e.g. URL="Laptops" matches "laptops" in DB
      const matched = categories.find(c => c.name?.toLowerCase().includes(urlCategory.toLowerCase()));
      if (matched) {
        setDbCategoryId(matched._id);
      } else {
        // If not found in our DB, just pass it blank or use the string (backend fallback)
        setDbCategoryId('');
      }
    }
    setPage(1);
  }, [urlCategory, categories]);

  // Also reset page on search query
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const fetchProductsList = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProducts({ search: searchQuery, category: dbCategoryId, page, limit: 15 });
      const res = data.data;
      if (page === 1) {
        setProducts(res.products || []);
      } else {
        setProducts(prev => [...prev, ...(res.products || [])]);
      }
      setHasMore(res.pagination ? res.pagination.currentPage < res.pagination.totalPages : false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products.');
      if (page === 1) setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, dbCategoryId, page]);

  useEffect(() => {
    fetchProductsList();
  }, [fetchProductsList]);

  // Helper clear filter
  const clearFilter = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="w-full pb-10">
      
      {/* Modern Flipkart Carousel — 3 Side-by-Side Round Cards */}
      <div className="max-w-[1400px] mx-auto pt-3 px-2 sm:px-4">
        <div className="relative group">
          {/* Animated Slider Container */}
          <div className="relative overflow-hidden w-full h-[140px] sm:h-[180px] md:h-[220px] lg:h-[250px] transition-all">
            {BANNER_GROUPS.map((group, groupIdx) => (
              <div 
                key={groupIdx} 
                className={`absolute inset-0 w-full h-full flex gap-3 sm:gap-4 md:gap-5 transition-all duration-700 ease-in-out ${groupIdx === bannerIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
              >
                {group.map((src, imgIdx) => (
                  <div 
                    key={imgIdx} 
                    className={`relative flex-1 h-full rounded-[10px] md:rounded-[14px] overflow-hidden cursor-pointer shadow-sm hover:shadow transition-shadow ${imgIdx > 0 ? 'hidden md:block' : ''} ${imgIdx > 1 ? 'hidden lg:block' : ''}`}
                  >
                    <img src={src} className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]" alt={`promo-${groupIdx}-${imgIdx}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-3 mb-2 space-x-1.5">
            {BANNER_GROUPS.map((_, i) => (
              <button key={i} onClick={() => setBannerIndex(i)}
                className={`h-[5px] rounded-full transition-all duration-300 ${i === bannerIndex ? 'w-5 bg-[#c2c2c2]' : 'w-1.5 bg-[#e0e0e0] hover:bg-[#d0d0d0]'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Full Width */}
      <div className="max-w-[1400px] mx-auto mt-4 px-2 sm:px-4">
        <section className="w-full bg-white shadow-sm min-h-[600px]">
          
          {/* Header Row */}
          <div className="p-4 border-b flex justify-between items-center bg-white sticky top-14 z-30 shadow-sm border-t">
            <h2 className="text-[18px] font-medium text-gray-900 flex items-center">
              {searchQuery ? `Search Results for "${searchQuery}"` : (urlCategory ? `Showing ${urlCategory}` : 'Best of Electronics & More')}
              {!loading && <span className="text-[14px] font-normal text-gray-500 ml-3 bg-gray-100 px-2 py-0.5 rounded-sm">({products.length} Items)</span>}
            </h2>
            
            {urlCategory && (
              <button onClick={clearFilter} className="text-[14px] text-flipkartBlue font-medium hover:underline px-4 py-1.5 border border-flipkartBlue rounded-sm bg-blue-50">
                Clear Filters
              </button>
            )}
          </div>

          {/* Grid Container */}
          <div className="p-0">
            {error && <div className="p-6 bg-red-50 text-red-600 text-sm m-4">{error}</div>}
            
            {loading && page === 1 ? (
              <Loader />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/error-no-search-results_2353c5.png" alt="no results" className="w-64 mb-6" />
                <p className="text-2xl font-semibold text-gray-800">Sorry, no results found!</p>
                <p className="text-gray-500 mt-2 text-sm">Please check the spelling or try searching for something else</p>
              </div>
            ) : (
              <>
                {/* 5-Column Grid on large screens just like Flipkart */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 divide-x divide-y border-t border-l">
                  {products.map((product, idx) => (
                    <div key={product._id || idx} className="border-b border-r bg-white hover:z-10 relative">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-8 mb-8 flex justify-center">
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={loading}
                      className="px-10 py-3 bg-flipkartBlue text-white shadow-sm font-semibold rounded-sm tracking-wide text-[14px] hover:bg-blue-600 uppercase transition-colors"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
