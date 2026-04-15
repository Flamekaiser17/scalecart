import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

// Deterministic review count from product ID
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
      className="group block h-full bg-white relative flex flex-col p-[16px] transition-all duration-200 hover:shadow-[0_3px_16px_0_rgba(0,0,0,0.11)] hover:z-10"
    >
      {/* Wishlist Heart */}
      <button
        onClick={handleWishlistClick}
        className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm hover:shadow transition-all"
        aria-label="Toggle Wishlist"
      >
        <Heart
          size={16}
          className={`transition-colors ${wishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
          strokeWidth={wishlisted ? 2 : 1.5}
        />
      </button>

      {/* Product Image */}
      <div className={`w-full h-[180px] flex items-center justify-center mb-3 overflow-hidden ${isOut ? 'opacity-40 grayscale' : ''}`}>
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/200'}
          alt={product.name}
          loading="lazy"
          className="max-h-full max-w-full object-contain group-hover:scale-[1.04] transition-transform duration-300"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand */}
        <p className="text-[#878787] text-[13px] font-medium mb-0.5 truncate leading-tight">
          {brandName}
        </p>
        
        {/* Title */}
        <h3 className="text-[#212121] text-[14px] font-normal leading-[1.35] line-clamp-2 mb-2 group-hover:text-flipkartBlue transition-colors min-h-[38px]">
          {product.name}
          {isOut && <span className="text-red-500 font-medium text-[12px] ml-1">(Out of Stock)</span>}
        </h3>

        {/* Rating Row */}
        {product.rating && (
          <div className="flex items-center mb-2">
            <span className="bg-[#388e3c] text-white text-[12px] font-bold px-[5px] py-[1px] rounded-[2px] inline-flex items-center gap-[2px] leading-[18px]">
              {Number(product.rating).toFixed(1)} <span className="text-[9px]">★</span>
            </span>
            <span className="text-[#878787] text-[13px] ml-2 font-medium">
              ({reviewCount.toLocaleString()})
            </span>
          </div>
        )}

        {/* Pricing Row — pushed to bottom */}
        <div className="mt-auto pt-1 flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
          <span className="text-[16px] font-medium text-[#212121]">
            ₹{Math.floor(displayPrice).toLocaleString('en-IN')}
          </span>
          {product.discount > 0 && (
            <>
              <span className="text-[13px] text-[#878787] line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span className="text-[13px] font-medium text-[#388e3c]">
                {product.discount}% off
              </span>
            </>
          )}
        </div>
        
        {/* Free delivery badge */}
        <p className="mt-1.5 text-[12px] text-[#212121] font-normal">
          Free delivery
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
