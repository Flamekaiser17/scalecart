import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

// Deterministic review count
const getReviewCount = (id = '') => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return (Math.abs(hash) % 500) + 50;
};

const ProductCard = ({ product }) => {
  const displayPrice = product.price - (product.price * ((product.discount || 0) / 100));
  const reviewCount = getReviewCount(product._id?.toString());
  const isOut = !product.stock || product.stock === 0;

  const { toggleWishlist, isWishlisted } = useWishlist();
  const { isLoggedIn, setShowAuthModal } = useCart();
  const wishlisted = isWishlisted(product._id);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    toggleWishlist(product);
  };

  const brandName = product.brandId?.name || 'Generic';

  return (
    <Link
      to={`/product/${product._id}`}
      className="group block h-full bg-white hover:shadow-[0_3px_16px_0_rgba(0,0,0,0.11)] transition-shadow duration-300 relative flex flex-col p-4 border-transparent border hover:border-gray-100"
    >
      {/* Wishlist Heart */}
      <button
        onClick={handleWishlistClick}
        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50/50 hover:bg-gray-100/80 transition-colors"
      >
        <Heart
          size={18}
          className={wishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400 fill-[#f1f3f6]'}
          strokeWidth={wishlisted ? 2 : 1.5}
        />
      </button>

      {/* Product Image */}
      <div className={`w-full h-[200px] flex items-center justify-center mb-5 overflow-hidden ${isOut ? 'opacity-40 grayscale' : ''}`}>
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/200'}
          alt={product.name}
          className="object-contain h-full w-full group-hover:scale-[1.02] transition-transform duration-300"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col text-[14px]">
        {/* Brand */}
        <p className="text-[#878787] font-semibold text-[13px] mb-1 truncate">
          {brandName}
        </p>
        
        {/* Title */}
        <h3 className="text-[#212121] font-normal leading-[1.4] line-clamp-2 mb-1.5 group-hover:text-flipkartBlue transition-colors">
          {product.name}
          {isOut && <span className="text-red-500 font-medium ml-1">(Out of Stock)</span>}
        </h3>

        {/* Rating Row */}
        <div className="flex items-center mb-2.5">
          <span className="bg-[#388e3c] text-white text-[12px] font-bold px-1.5 py-0.5 rounded-sm flex items-center justify-center gap-0.5">
            {product.rating || '4.0'} <span className="text-[10px]">★</span>
          </span>
          <span className="text-[#878787] text-[13px] ml-2 font-medium tracking-wide">
            ({reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Pricing Row */}
        <div className="mt-auto pt-1 flex items-baseline flex-wrap gap-2">
          <span className="text-[16px] font-medium text-[#212121]">
            ₹{Math.floor(displayPrice).toLocaleString('en-IN')}
          </span>
          {product.discount > 0 && (
            <>
              <span className="text-[14px] font-normal text-[#878787] line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span className="text-[13px] font-medium text-[#388e3c] tracking-wide">
                {product.discount}% off
              </span>
            </>
          )}
        </div>
        
        {/* Free delivery badge */}
        <div className="mt-2 text-[12px] text-[#212121]">
          Free delivery
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
