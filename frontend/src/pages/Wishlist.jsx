import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const Wishlist = () => {
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { addToCart, setShowAuthModal, isLoggedIn } = useCart();

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center bg-white shadow-sm mt-4 min-h-[500px] p-10">
        <Heart className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-medium mb-2">Please login to view your Wishlist</h2>
        <p className="text-sm text-gray-500 mb-6">Save your favourite items here.</p>
        <button onClick={() => setShowAuthModal(true)} className="px-12 py-3 bg-flipkartBlue text-white font-medium rounded-sm text-sm shadow">
          Login / Register
        </button>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-white shadow-sm mt-4 min-h-[500px] p-10">
        <Heart className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-medium mb-2">Your Wishlist is empty</h2>
        <p className="text-sm text-gray-500 mb-6">Save items you love to your wishlist.</p>
        <Link to="/" className="px-12 py-3 bg-flipkartBlue text-white font-medium rounded-sm text-sm shadow">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const handleMoveToCart = (item) => {
    const product = item.productId;
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price - (product.price * ((product.discount || 0) / 100)),
      image: product.images?.[0],
      quantity: 1,
    });
    toggleWishlist(product); // Remove from wishlist after adding to cart
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      <div className="bg-white shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center gap-3">
          <Heart className="w-5 h-5 text-flipkartBlue" fill="currentColor" />
          <h1 className="text-lg font-medium">
            My Wishlist <span className="text-gray-500 font-normal text-sm">({wishlistItems.length} items)</span>
          </h1>
        </div>

        {/* Grid of wishlisted items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border-t border-l">
          {wishlistItems.map((item, i) => {
            const product = item.productId;
            if (!product || typeof product === 'string') return null;
            const displayPrice = product.price - (product.price * ((product.discount || 0) / 100));

            return (
              <div key={item._id || i} className="border-b border-r p-4 flex flex-col group">
                {/* Product Image */}
                <Link to={`/product/${product._id}`} className="block">
                  <div className="h-44 flex items-center justify-center mb-3 overflow-hidden">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="text-sm text-gray-800 font-medium line-clamp-2 mb-1 group-hover:text-flipkartBlue">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-bold text-gray-900">₹{Math.floor(displayPrice).toLocaleString('en-IN')}</span>
                    {product.discount > 0 && (
                      <span className="text-xs text-green-600 font-semibold">{product.discount}% off</span>
                    )}
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-flipkartOrange text-white text-xs font-bold uppercase rounded-sm hover:opacity-90"
                  >
                    <ShoppingCart size={14} /> Add to Cart
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    title="Remove from Wishlist"
                    className="w-10 flex items-center justify-center border border-red-200 text-red-400 hover:bg-red-50 rounded-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
