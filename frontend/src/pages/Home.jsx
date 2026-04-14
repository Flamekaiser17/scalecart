import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

// Category icon mapping (using emojis as fallback icons)
const CATEGORY_ICONS = {
  beauty: '💄', electronics: '📱', furniture: '🛋️', fragrances: '🌸',
  groceries: '🛒', fashion: '👗', mobiles: '📱', appliances: '📺',
};

// Flipkart-style banner images (free CDN banners)
const BANNERS = [
  'https://rukminim2.flixcart.com/fk-p-flap/1600/270/image/bc264983059d0a20.jpg?q=20',
  'https://rukminim2.flixcart.com/fk-p-flap/1600/270/image/25f6b31bcb97d45e.jpg?q=20',
  'https://rukminim2.flixcart.com/fk-p-flap/1600/270/image/94a73507efcf1278.jpg?q=20',
];

const Home = ({ searchQuery = '' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  // Auto-rotate banner every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(i => (i + 1) % BANNERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res.data || []);
      } catch (err) {
        console.log('Failed to fetch categories', err.message);
      }
    };
    fetchCategories();
  }, []);

  // Reset page when search or category changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, category]);

  const fetchProductsList = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProducts({ search: searchQuery, category, page, limit: 12 });
      const res = data.data;
      if (page === 1) {
        setProducts(res.products || []);
      } else {
        setProducts(prev => [...prev, ...(res.products || [])]);
      }
      setHasMore(res.pagination ? res.pagination.currentPage < res.pagination.totalPages : false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products. Is the backend running?');
      if (page === 1) setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, category, page]);

  useEffect(() => {
    fetchProductsList();
  }, [fetchProductsList]);

  return (
    <div className="w-full">
      
      {/* Category Icon Row — Flipkart Style */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center overflow-x-auto space-x-6 py-3 scrollbar-hide">
            <div
              className={`flex flex-col items-center cursor-pointer flex-shrink-0 group min-w-[60px] ${category === '' ? 'text-flipkartBlue' : 'text-gray-700'}`}
              onClick={() => { setCategory(''); setPage(1); }}
            >
              <span className="text-2xl mb-1">🏠</span>
              <span className="text-xs font-medium group-hover:text-flipkartBlue whitespace-nowrap">All</span>
              {category === '' && <div className="h-0.5 bg-flipkartBlue w-full mt-1"></div>}
            </div>
            {categories.map(cat => (
              <div
                key={cat._id}
                className={`flex flex-col items-center cursor-pointer flex-shrink-0 group min-w-[60px] ${category === cat._id ? 'text-flipkartBlue' : 'text-gray-700'}`}
                onClick={() => { setCategory(cat._id); setPage(1); }}
              >
                <span className="text-2xl mb-1">{CATEGORY_ICONS[cat.name?.toLowerCase()] || '📦'}</span>
                <span className="text-xs font-medium group-hover:text-flipkartBlue whitespace-nowrap capitalize">{cat.name}</span>
                {category === cat._id && <div className="h-0.5 bg-flipkartBlue w-full mt-1"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banner Carousel */}
      <div className="relative overflow-hidden bg-gray-100 h-[160px] sm:h-[220px] lg:h-[270px] mt-0">
        {BANNERS.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`banner-${i}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === bannerIndex ? 'opacity-100' : 'opacity-0'}`}
            onError={(e) => e.target.src = 'https://via.placeholder.com/1600x270/2874f0/ffffff?text=Flipkart+Sale'}
          />
        ))}
        {/* Banner Navigation Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => setBannerIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === bannerIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* Main Content — Sidebar + Grid */}
      <div className="max-w-7xl mx-auto flex mt-2">
        
        {/* Sidebar Filters on Desktop */}
        <aside className="w-64 bg-white shadow-sm mr-2 hidden lg:block min-h-[600px] p-4 text-sm sticky top-16 self-start">
          <h2 className="text-[15px] uppercase font-bold mb-4 pb-3 border-b">Filters</h2>
          
          {/* Search in Sidebar */}
          <div className="mb-5 pb-5 border-b">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Search</p>
            <p className="text-xs text-gray-400 italic">Use the search bar above</p>
          </div>

          {/* Categories in Sidebar */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase">Categories</p>
            <ul className="space-y-2.5 font-normal text-gray-700">
              <li className={`cursor-pointer flex items-center ${category === '' ? 'font-semibold text-flipkartBlue' : 'hover:text-flipkartBlue'}`}
                onClick={() => { setCategory(''); setPage(1); }}>
                <span className="mr-2">🏠</span> All Products
              </li>
              {categories.map(cat => (
                <li key={cat._id}
                  className={`cursor-pointer flex items-center capitalize ${category === cat._id ? 'font-semibold text-flipkartBlue' : 'hover:text-flipkartBlue'}`}
                  onClick={() => { setCategory(cat._id); setPage(1); }}>
                  <span className="mr-2">{CATEGORY_ICONS[cat.name?.toLowerCase()] || '📦'}</span>
                  {cat.name}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Product Grid Section */}
        <section className="flex-1 bg-white shadow-sm min-h-[600px]">
          {/* Section Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium">
              {searchQuery ? `Results for "${searchQuery}"` : (category ? categories.find(c => c._id === category)?.name || 'Products' : 'All Products')}
              {!loading && <span className="text-sm font-normal text-gray-500 ml-2">({products.length} items)</span>}
            </h2>
          </div>

          <div className="p-4">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded text-sm mb-4">{error}</div>}
            
            {loading && page === 1 ? (
              <Loader />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                <span className="text-6xl mb-4">🔍</span>
                <p className="text-xl font-semibold text-gray-600">No results found!</p>
                <p className="text-sm mt-1">Try a different category or search term</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 border-t border-l">
                  {products.map(product => (
                    <div key={product._id} className="border-b border-r">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={loading}
                      className="px-8 py-2.5 bg-white border border-gray-300 shadow-sm font-semibold rounded text-flipkartBlue hover:bg-gray-50 text-sm"
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
