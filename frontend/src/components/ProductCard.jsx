import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

// Deterministic review count from product ID — stable across re-renders
const getReviewCount = (id = '') => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return (Math.abs(hash) % 500) + 50;
};

const ProductCard = ({ product }) => {
  const displayPrice = product.price - (product.price * ((product.discount || 0) / 100));
  const reviewCount = getReviewCount(product._id?.toString());
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = !product.stock || product.stock === 0;

  const { toggleWishlist, isWishlisted } = useWishlist();
  const { isLoggedIn, setShowAuthModal } = useCart();
  const wishlisted = isWishlisted(product._id);

  const handleWishlistClick = (e) => {
    e.preventDefault(); // Stop the <Link> navigation
    e.stopPropagation();
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    toggleWishlist(product);
  };

  return (
    <Link
      to={`/product/${product._id}`}
      className="group block h-full bg-white hover:shadow-xl transition-shadow duration-300 p-4 flex flex-col justify-between relative"
    >
      {/* Wishlist Heart Button */}
      <button
        onClick={handleWishlistClick}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 shadow-sm hover:bg-white transition-colors"
        title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart
          size={16}
          className={`transition-colors ${wishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-400'}`}
        />
      </button>

      {/* Stock Badges */}
      {isLowStock && (
        <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm z-10">
          Only {product.stock} left!
        </span>
      )}
      {isOutOfStock && (
        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm z-10">
          Out of Stock
        </span>
      )}

      {/* Product Image */}
      <div className={`w-full h-48 flex items-center justify-center mb-4 overflow-hidden ${isOutOfStock ? 'opacity-50' : ''}`}>
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/200'}
          alt={product.name}
          className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col text-sm">
        <h3 className="text-gray-800 font-medium group-hover:text-flipkartBlue line-clamp-2 mb-1">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center mb-2">
          <span className="bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center justify-center">
            {product.rating || '4.0'} ★
          </span>
          <span className="text-gray-400 text-xs ml-1.5">({reviewCount.toLocaleString()})</span>
        </div>

        {/* Pricing */}
        <div className="mt-auto pt-2 flex items-baseline flex-wrap gap-1">
          <span className="text-base font-bold text-gray-900">
            ₹{Math.floor(displayPrice).toLocaleString('en-IN')}
          </span>
          {product.discount > 0 && (
            <>
              <span className="text-sm font-normal text-gray-400 line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-green-600">
                {product.discount}% off
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
