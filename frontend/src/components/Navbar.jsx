import React, { useState } from 'react';
import { Search, ShoppingCart, ChevronDown, User, LogOut, Heart, ClipboardList } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { logoutUser } from '../services/api';
import AuthModal from './AuthModal';

const Navbar = ({ onSearch }) => {
  const { cartItems, isLoggedIn, showAuthModal, setShowAuthModal, onLogout } = useCart();
  const { wishlistIds } = useWishlist();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const handleLogout = async () => {
    try { await logoutUser(); } catch (_) {}
    localStorage.removeItem('user');
    onLogout(); // Tells CartContext to clear items + set isLoggedIn = false
    setShowUserMenu(false);
    navigate('/');
  };

  const handleSearch = (val) => {
    setSearchInput(val);
    if (onSearch) onSearch(val);
  };

  const totalItems = cartItems?.length || 0;

  return (
    <>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <nav className="bg-flipkartBlue text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center h-14 gap-3">

            {/* Logo */}
            <Link to="/" className="flex flex-col flex-shrink-0 mr-3">
              <span className="text-xl font-bold italic leading-none">Flipkart</span>
              <span className="text-[10px] text-yellow-200 italic flex items-center mt-0.5">
                Explore <span className="text-yellow-300 font-bold ml-0.5">Plus</span>
              </span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl relative hidden sm:flex items-center">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search for products, brands and more"
                className="w-full text-black text-sm px-4 py-2 rounded-sm outline-none"
              />
              <button className="absolute right-0 top-0 h-full px-4 text-flipkartBlue bg-white rounded-r-sm hover:bg-gray-50">
                <Search size={18} />
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-5 ml-2 text-sm font-medium whitespace-nowrap">

              {isLoggedIn && user ? (
                // Logged-in: show username dropdown
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1 hover:underline"
                  >
                    <User size={15} className="mr-1" />
                    <span className="max-w-[80px] truncate">{user.email?.split('@')[0] || 'Account'}</span>
                    <ChevronDown size={13} />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 shadow-xl w-44 py-1 z-50 rounded-sm">
                      <Link to="/orders" onClick={() => setShowUserMenu(false)} className="flex items-center px-4 py-2.5 text-xs hover:bg-gray-50">
                        <ClipboardList size={13} className="mr-2 text-flipkartBlue" /> My Orders
                      </Link>
                      <Link to="/wishlist" onClick={() => setShowUserMenu(false)} className="flex items-center px-4 py-2.5 text-xs hover:bg-gray-50">
                        <Heart size={13} className="mr-2 text-red-400" /> Wishlist
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center text-xs text-red-600">
                        <LogOut size={13} className="mr-2" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Logged-out: Login button
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-white text-flipkartBlue font-medium px-6 py-1.5 rounded-sm shadow-sm hover:shadow text-sm"
                >
                  Login
                </button>
              )}

              <span className="hidden lg:block cursor-pointer hover:underline">Become a Seller</span>

              {/* Wishlist Icon */}
              <Link to="/wishlist" className="hidden md:flex items-center cursor-pointer hover:underline relative">
                <div className="relative mr-1">
                  <Heart size={19} />
                  {wishlistIds.size > 0 && (
                    <span className="absolute -top-2 left-3 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full leading-none">
                      {wishlistIds.size}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline">Wishlist</span>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="flex items-center cursor-pointer hover:underline">
                <div className="relative mr-1.5">
                  <ShoppingCart size={19} />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 left-3 bg-flipkartOrange text-white text-[10px] font-bold px-1 py-0.5 rounded-full leading-none">
                      {totalItems}
                    </span>
                  )}
                </div>
                Cart
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="sm:hidden px-4 pb-2">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full text-black text-sm px-3 py-1.5 rounded-sm outline-none"
            />
            <button className="absolute right-0 top-0 h-full px-3 text-flipkartBlue">
              <Search size={16} />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
