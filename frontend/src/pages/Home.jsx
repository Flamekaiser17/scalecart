import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Banner carousel images — reliable Unsplash sources
const BANNERS = [
  'https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=1400&h=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1400&h=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1400&h=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&h=300&auto=format&fit=crop',
];

const Home = ({ searchQuery = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [dbCategoryId, setDbCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  // Auto-rotate banner
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(i => (i + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const prevBanner = () => setBannerIndex(i => (i - 1 + BANNERS.length) % BANNERS.length);
  const nextBanner = () => setBannerIndex(i => (i + 1) % BANNERS.length);

  // Fetch categories
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

  // Map URL category string to DB category ID
  useEffect(() => {
    if (!urlCategory) {
      setDbCategoryId('');
    } else {
      // Use exact case-insensitive match to prevent e.g. "Men" matching "Women Dresses"
      const matched = categories.find(c => c.name?.toLowerCase() === urlCategory.toLowerCase());
      // Prisma uses 'id', not '_id'
      setDbCategoryId(matched ? (matched.id || matched._id) : '');
    }
    setPage(1);
  }, [urlCategory, categories]);

  // Reset page on search
  useEffect(() => { setPage(1); }, [searchQuery]);

  // Fetch products
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
      setTotalItems(res.pagination?.totalItems || 0);
      setHasMore(res.pagination ? res.pagination.currentPage < res.pagination.totalPages : false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products.');
      if (page === 1) setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, dbCategoryId, page]);

  useEffect(() => { fetchProductsList(); }, [fetchProductsList]);

  const clearFilter = () => setSearchParams(new URLSearchParams());

  // Header text
  const getHeaderText = () => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    if (urlCategory) return urlCategory;
    return 'Best of Electronics & More';
  };

  return (
    <div className="w-full pb-10">
      
      {/* ===== BANNER CAROUSEL ===== */}
      <div className="relative w-full bg-[#f0f0f0] overflow-hidden h-[140px] sm:h-[200px] md:h-[240px] lg:h-[280px] group">
        {BANNERS.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`banner-${i}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${i === bannerIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        
        {/* Dark gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/15 to-transparent pointer-events-none"></div>

        {/* Left/Right arrows */}
        <button onClick={prevBanner} className="absolute left-0 top-0 bottom-0 w-10 sm:w-14 flex items-center justify-center bg-white/80 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer" aria-label="Previous banner">
          <ChevronLeft size={24} />
        </button>
        <button onClick={nextBanner} className="absolute right-0 top-0 bottom-0 w-10 sm:w-14 flex items-center justify-center bg-white/80 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer" aria-label="Next banner">
          <ChevronRight size={24} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => setBannerIndex(i)}
              className={`h-[6px] rounded-full transition-all duration-300 cursor-pointer ${i === bannerIndex ? 'w-5 bg-white' : 'w-[6px] bg-white/50 hover:bg-white/70'}`}
              aria-label={`Show banner ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ===== PRODUCT LISTING SECTION ===== */}
      <div className="fk-container mt-2.5">
        <section className="w-full bg-white shadow-sm">
          
          {/* Sticky header row */}
          <div className="px-4 py-3 border-b flex justify-between items-center bg-white sticky top-[96px] z-20">
            <h2 className="text-[18px] font-medium text-[#212121] flex items-center gap-2">
              {getHeaderText()}
              {!loading && (
                <span className="text-[13px] font-normal text-[#878787]">
                  (Showing 1 - {products.length} of {totalItems || products.length} products)
                </span>
              )}
            </h2>
            
            {urlCategory && (
              <button onClick={clearFilter} className="text-[13px] text-flipkartBlue font-medium hover:underline px-3 py-1.5 border border-flipkartBlue/30 rounded-sm bg-blue-50/50 transition-colors hover:bg-blue-50 cursor-pointer">
                Clear Filters
              </button>
            )}
          </div>

          {/* Grid */}
          <div>
            {error && <div className="p-4 bg-red-50 text-red-600 text-sm m-4 rounded">{error}</div>}
            
            {loading && page === 1 ? (
              <Loader count={15} type="grid" />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/error-no-search-results_2353c5.png" alt="no results" className="w-56 mb-6 opacity-80" />
                <p className="text-[20px] font-medium text-[#212121] mb-2">Sorry, no results found!</p>
                <p className="text-[14px] text-[#878787]">Please check the spelling or try searching for something else</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 divide-x divide-y divide-[#f0f0f0]">
                  {products.map((product, idx) => (
                    <div key={product._id || idx} className="bg-white">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="py-6 flex justify-center border-t">
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={loading}
                      className="px-10 py-3 bg-flipkartBlue text-white font-medium rounded-sm text-[14px] hover:bg-blue-600 uppercase tracking-wide transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Loading...' : 'Load More Products'}
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
