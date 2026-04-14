import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, Tag, CheckCircle } from 'lucide-react';
import { getProductById } from '../services/api';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';

// Deterministic review count from product ID (no Math.random() re-renders)
const getReviewCount = (id = '') => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return { ratings: (Math.abs(hash) % 8000) + 100, reviews: (Math.abs(hash >> 4) % 500) + 50 };
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isLoggedIn, setShowAuthModal } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  // Toast state — replaces browser alert()
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, message, type });
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await getProductById(id);
        setProduct(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [id]);

  if (loading) return <Loader />;
  if (error || !product) return (
    <div className="flex flex-col items-center justify-center p-20 bg-white shadow-sm mt-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong.</h2>
      <p className="text-gray-500">{error || 'Product not found.'}</p>
      <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-flipkartBlue text-white rounded shadow">
        Back to Home
      </button>
    </div>
  );

  const displayPrice = product.price - (product.price * ((product.discount || 0) / 100));
  const { ratings, reviews } = getReviewCount(product._id?.toString());

  // Stock status helper
  const getStockStatus = (stock) => {
    if (!stock || stock === 0) return { label: '❌ Out of Stock', color: 'text-red-600', disabled: true };
    if (stock <= 5) return { label: `⚠️ Only ${stock} left!`, color: 'text-orange-500', disabled: false };
    return { label: '✅ In Stock', color: 'text-green-600', disabled: false };
  };
  const stockStatus = getStockStatus(product.stock);

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    if (stockStatus.disabled) {
      showToast('This product is out of stock', 'error');
      return;
    }
    addToCart({
      productId: product._id,
      name: product.name,
      price: displayPrice,
      image: product.images?.[0],
      quantity: 1,
    });
    showToast('Added to cart successfully!', 'success');
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    if (stockStatus.disabled) {
      showToast('This product is out of stock', 'error');
      return;
    }
    // Add to cart silently then navigate — no double toast
    addToCart({
      productId: product._id,
      name: product.name,
      price: displayPrice,
      image: product.images?.[0],
      quantity: 1,
    });
    navigate('/checkout');
  };

  return (
    <div className="relative">
      {/* ---- Toast Notification (replaces alert()) ---- */}
      {toast.show && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded shadow-lg text-white text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
          <CheckCircle size={16} />
          {toast.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row bg-white mt-4 shadow-sm min-h-[600px]">

        {/* Left Column — Image Gallery */}
        <div className="w-full md:w-5/12 p-4 border-r border-gray-200 sticky top-14 h-fit">
          <div className="flex">
            {/* Thumbnails */}
            <div className="w-16 flex flex-col space-y-2 mr-2">
              {product.images?.map((img, index) => (
                <div
                  key={index}
                  onMouseEnter={() => setSelectedImage(index)}
                  onClick={() => setSelectedImage(index)}
                  className={`border p-1 cursor-pointer h-16 w-16 flex items-center justify-center rounded-sm ${selectedImage === index ? 'border-flipkartBlue' : 'border-gray-200 hover:border-gray-400'}`}
                >
                  <img src={img} alt={`thumb-${index}`} className="max-h-full max-w-full object-contain" />
                </div>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 border border-gray-100 p-4 flex items-center justify-center h-96">
              <img
                src={product.images?.[selectedImage] || 'https://via.placeholder.com/400'}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex mt-6 space-x-2 px-2">
            <button
              onClick={handleAddToCart}
              disabled={stockStatus.disabled}
              className="flex-1 flex items-center justify-center py-4 bg-flipkartYellow text-white font-bold rounded-sm shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={20} className="mr-2" /> ADD TO CART
            </button>
            <button
              onClick={handleBuyNow}
              disabled={stockStatus.disabled}
              className="flex-1 flex items-center justify-center py-4 bg-flipkartOrange text-white font-bold rounded-sm shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={20} className="mr-2 fill-current" /> BUY NOW
            </button>
          </div>
        </div>

        {/* Right Column — Product Info */}
        <div className="w-full md:w-7/12 p-6">
          <h1 className="text-xl text-gray-800 font-medium mb-2">{product.name}</h1>

          {/* Rating Block */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="bg-green-600 text-white text-sm font-bold px-2 py-0.5 rounded flex items-center">
              {product.rating || '4.2'} ★
            </span>
            <span className="text-gray-500 text-sm">
              {ratings.toLocaleString()} Ratings & {reviews.toLocaleString()} Reviews
            </span>
            <span className="text-gray-300">|</span>
            <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png" alt="assured" className="h-5" />
          </div>

          {/* Stock Availability — NEW */}
          <div className={`text-sm font-semibold mb-3 ${stockStatus.color}`}>
            {stockStatus.label}
          </div>

          {/* Price Block */}
          <div className="mb-4">
            <div className="text-3xl font-bold text-gray-900 inline-block mr-3">
              ₹{Math.floor(displayPrice).toLocaleString('en-IN')}
            </div>
            {product.discount > 0 && (
              <>
                <strike className="text-gray-500 font-medium mr-3">₹{product.price.toLocaleString('en-IN')}</strike>
                <span className="text-green-600 font-bold tracking-wide">{product.discount}% off</span>
              </>
            )}
          </div>

          {/* Offers Block */}
          <div className="mb-6">
            <h3 className="font-semibold text-base mb-2">Available offers</h3>
            <ul className="space-y-1.5 text-sm text-gray-800">
              <li className="flex"><Tag size={15} className="text-green-600 mr-2 mt-0.5 shrink-0" />Special Price — Get extra 16% off (price inclusive of cashback/coupon)</li>
              <li className="flex"><Tag size={15} className="text-green-600 mr-2 mt-0.5 shrink-0" />Bank Offer — Flat ₹1,200 off on HDFC Bank Credit Card EMI</li>
              <li className="flex"><Tag size={15} className="text-green-600 mr-2 mt-0.5 shrink-0" />Cashback — Buy this product & get surprise cashback coupon in inbox</li>
            </ul>
          </div>

          {/* Description + Brand */}
          <div className="border-t border-gray-200 pt-5 space-y-3">
            <div className="flex">
              <h3 className="w-28 text-gray-500 font-medium text-sm shrink-0">Description</h3>
              <p className="flex-1 text-sm leading-relaxed text-gray-700">{product.description}</p>
            </div>
            <div className="flex">
              <h3 className="w-28 text-gray-500 font-medium text-sm shrink-0">Brand</h3>
              <p className="flex-1 text-sm capitalize">{product.brandId?.name || 'Authorized External'}</p>
            </div>
            <div className="flex">
              <h3 className="w-28 text-gray-500 font-medium text-sm shrink-0">Stock</h3>
              <p className={`flex-1 text-sm font-medium ${stockStatus.color}`}>{product.stock ?? 'N/A'} units available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
