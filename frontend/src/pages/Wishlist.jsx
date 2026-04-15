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
      <div className="fk-container mt-4">
        <div className="flex flex-col items-center justify-center bg-white shadow-sm py-16">
          <Heart className="w-14 h-14 text-[#d5d5d5] mb-4" strokeWidth={1.2} />
          <h2 className="text-[18px] font-medium text-[#212121] mb-2">Please login to view your Wishlist</h2>
          <p className="text-[14px] text-[#878787] mb-6">Save your favourite items here.</p>
          <button onClick={() => setShowAuthModal(true)} className="px-12 py-3 bg-flipkartBlue text-white font-medium rounded-sm text-[14px] cursor-pointer">
            Login / Register
          </button>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="fk-container mt-4">
        <div className="flex flex-col items-center justify-center bg-white shadow-sm py-16">
          <Heart className="w-14 h-14 text-[#d5d5d5] mb-4" strokeWidth={1.2} />
          <h2 className="text-[18px] font-medium text-[#212121] mb-2">Your Wishlist is empty</h2>
          <p className="text-[14px] text-[#878787] mb-6">Save items you love to your wishlist.</p>
          <Link to="/" className="px-12 py-3 bg-flipkartBlue text-white font-medium rounded-sm text-[14px]">
            Continue Shopping
          </Link>
        </div>
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
    toggleWishlist(product);
  };

  return (
    <div className="fk-container mt-3">
      <div className="bg-white shadow-sm">
        {/* Header */}
        <div className="px-5 py-3 border-b flex items-center gap-2">
          <Heart className="w-[18px] h-[18px] text-flipkartBlue fill-flipkartBlue" />
          <h1 className="text-[16px] font-medium text-[#212121]">
            My Wishlist <span className="text-[14px] text-[#878787] font-normal">({wishlistItems.length})</span>
          </h1>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 divide-x divide-y divide-[#f0f0f0]">
          {wishlistItems.map((item, i) => {
            const product = item.productId;
            if (!product || typeof product === 'string') return null;
            const displayPrice = product.price - (product.price * ((product.discount || 0) / 100));

            return (
              <div key={item._id || i} className="p-4 flex flex-col group bg-white hover:shadow-[0_3px_16px_0_rgba(0,0,0,0.11)] hover:z-10 relative transition-shadow">
                {/* Product Image */}
                <Link to={`/product/${product._id}`} className="block">
                  <div className="h-[160px] flex items-center justify-center mb-3 overflow-hidden">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-[14px] text-[#212121] line-clamp-2 mb-1 group-hover:text-flipkartBlue transition-colors leading-tight">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-bold text-[16px] text-[#212121]">₹{Math.floor(displayPrice).toLocaleString('en-IN')}</span>
                    {product.discount > 0 && (
                      <>
                        <span className="text-[13px] text-[#878787] line-through">₹{product.price.toLocaleString('en-IN')}</span>
                        <span className="text-[13px] text-[#388e3c] font-medium">{product.discount}% off</span>
                      </>
                    )}
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#fb641b] text-white text-[12px] font-bold uppercase rounded-sm hover:bg-[#e85d19] transition-colors cursor-pointer"
                  >
                    <ShoppingCart size={13} /> Move to Cart
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    title="Remove from Wishlist"
                    className="w-10 flex items-center justify-center border border-[#e0e0e0] text-[#878787] hover:border-red-300 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors cursor-pointer"
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
