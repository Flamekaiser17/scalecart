import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, Tag, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { getProductById } from '../services/api';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';

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

  if (loading) return <Loader type="spinner" />;
  if (error || !product) return (
    <div className="fk-container mt-4">
      <div className="flex flex-col items-center justify-center py-20 bg-white shadow-sm">
        <h2 className="text-[20px] font-medium text-[#212121] mb-2">Oops! Something went wrong.</h2>
        <p className="text-[14px] text-[#878787]">{error || 'Product not found.'}</p>
        <button onClick={() => navigate('/')} className="mt-6 px-8 py-2.5 bg-flipkartBlue text-white rounded-sm font-medium text-[14px] cursor-pointer">
          Back to Home
        </button>
      </div>
    </div>
  );

  const displayPrice = product.price - (product.price * ((product.discount || 0) / 100));
  const { ratings, reviews } = getReviewCount(product._id?.toString());

  const getStockStatus = (stock) => {
    if (!stock || stock === 0) return { label: 'Out of Stock', color: 'text-red-600', icon: XCircle, disabled: true };
    if (stock <= 5) return { label: `Hurry, Only ${stock} left!`, color: 'text-[#ff6161]', icon: AlertTriangle, disabled: false };
    return { label: 'In Stock', color: 'text-[#26a541]', icon: CheckCircle, disabled: false };
  };
  const stockStatus = getStockStatus(product.stock);
  const StockIcon = stockStatus.icon;

  const handleAddToCart = () => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    if (stockStatus.disabled) { showToast('This product is out of stock', 'error'); return; }
    addToCart({ productId: product._id, name: product.name, price: displayPrice, image: product.images?.[0], quantity: 1 });
    showToast('Added to cart successfully!', 'success');
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    if (stockStatus.disabled) { showToast('This product is out of stock', 'error'); return; }
    addToCart({ productId: product._id, name: product.name, price: displayPrice, image: product.images?.[0], quantity: 1 });
    navigate('/checkout');
  };

  return (
    <div className="relative">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-sm shadow-lg text-white text-[14px] font-medium toast-enter ${toast.type === 'success' ? 'bg-[#26a541]' : 'bg-[#ff6161]'}`}>
          <CheckCircle size={16} />
          {toast.message}
        </div>
      )}

      <div className="fk-container mt-2.5">
        <div className="flex flex-col md:flex-row bg-white shadow-sm min-h-[550px]">

          {/* Left — Image Gallery */}
          <div className="w-full md:w-[40%] p-4 border-r border-[#f0f0f0]">
            <div className="sticky top-[100px]">
              <div className="flex gap-2">
                {/* Thumbnails */}
                <div className="w-[64px] flex flex-col gap-1.5 shrink-0">
                  {product.images?.map((img, index) => (
                    <div
                      key={index}
                      onMouseEnter={() => setSelectedImage(index)}
                      onClick={() => setSelectedImage(index)}
                      className={`border p-1 cursor-pointer h-[56px] w-[56px] flex items-center justify-center rounded-sm transition-colors ${selectedImage === index ? 'border-flipkartBlue shadow-sm' : 'border-[#e0e0e0] hover:border-[#c2c2c2]'}`}
                    >
                      <img src={img} alt={`thumb-${index}`} className="max-h-full max-w-full object-contain" />
                    </div>
                  ))}
                </div>

                {/* Main Image */}
                <div className="flex-1 border border-[#f0f0f0] p-4 flex items-center justify-center h-[400px] rounded-sm">
                  <img
                    src={product.images?.[selectedImage] || 'https://via.placeholder.com/400'}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain transition-opacity duration-200"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex mt-4 gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={stockStatus.disabled}
                  className="flex-1 flex items-center justify-center py-[14px] bg-[#ff9f00] text-white font-bold rounded-sm text-[14px] uppercase tracking-wide hover:bg-[#e69100] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ShoppingCart size={18} className="mr-2" /> ADD TO CART
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={stockStatus.disabled}
                  className="flex-1 flex items-center justify-center py-[14px] bg-[#fb641b] text-white font-bold rounded-sm text-[14px] uppercase tracking-wide hover:bg-[#e85d19] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Zap size={18} className="mr-2 fill-current" /> BUY NOW
                </button>
              </div>
            </div>
          </div>

          {/* Right — Product Info */}
          <div className="w-full md:w-[60%] p-6">
            <h1 className="text-[18px] text-[#212121] font-normal leading-[1.4] mb-2">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#26a541] text-white text-[13px] font-bold px-[6px] py-[1px] rounded-sm inline-flex items-center gap-[2px]">
                {product.rating || '4.2'} <span className="text-[10px]">★</span>
              </span>
              <span className="text-[#878787] text-[14px]">
                {ratings.toLocaleString()} Ratings & {reviews.toLocaleString()} Reviews
              </span>
              <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png" alt="assured" className="h-[18px] ml-1" />
            </div>

            {/* Stock */}
            <div className={`text-[14px] font-semibold mb-3 flex items-center gap-1.5 ${stockStatus.color}`}>
              <StockIcon size={15} /> {stockStatus.label}
            </div>

            {/* Price */}
            <div className="mb-4 flex items-baseline flex-wrap gap-x-3">
              <span className="text-[28px] font-bold text-[#212121]">
                ₹{Math.floor(displayPrice).toLocaleString('en-IN')}
              </span>
              {product.discount > 0 && (
                <>
                  <span className="text-[16px] text-[#878787] line-through">₹{product.price.toLocaleString('en-IN')}</span>
                  <span className="text-[14px] text-[#26a541] font-bold">{product.discount}% off</span>
                </>
              )}
            </div>

            {/* Offers */}
            <div className="mb-6">
              <h3 className="text-[14px] font-bold text-[#212121] mb-2">Available offers</h3>
              <ul className="space-y-2 text-[14px] text-[#212121]">
                <li className="flex"><Tag size={14} className="text-[#26a541] mr-2 mt-0.5 shrink-0" />Special Price — Get extra 16% off (price inclusive of cashback/coupon)</li>
                <li className="flex"><Tag size={14} className="text-[#26a541] mr-2 mt-0.5 shrink-0" />Bank Offer — Flat ₹1,200 off on HDFC Bank Credit Card EMI</li>
                <li className="flex"><Tag size={14} className="text-[#26a541] mr-2 mt-0.5 shrink-0" />Partner Offer — Buy this product & get surprise cashback coupon</li>
              </ul>
            </div>

            {/* Specs */}
            <div className="border-t border-[#f0f0f0] pt-5 space-y-4">
              <div className="flex">
                <h3 className="w-[120px] text-[#878787] text-[14px] shrink-0">Description</h3>
                <p className="flex-1 text-[14px] leading-relaxed text-[#212121]">{product.description}</p>
              </div>
              <div className="flex">
                <h3 className="w-[120px] text-[#878787] text-[14px] shrink-0">Brand</h3>
                <p className="flex-1 text-[14px] capitalize text-[#212121]">{product.brandId?.name || 'Authorized Seller'}</p>
              </div>
              <div className="flex">
                <h3 className="w-[120px] text-[#878787] text-[14px] shrink-0">Stock</h3>
                <p className={`flex-1 text-[14px] font-medium ${stockStatus.color}`}>{product.stock ?? 'N/A'} units available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
