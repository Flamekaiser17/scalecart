import React, { useState } from 'react';
import { Search, ShoppingCart, ChevronDown, User, LogOut, Heart, ClipboardList, Bell, TrendingUp, Download, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { logoutUser } from '../services/api';
import AuthModal from './AuthModal';

const SubNavCat = ({ title, options }) => (
  <div className="group relative h-full flex items-center cursor-pointer py-2">
    <Link to={`/?category=${encodeURIComponent(title)}`} className="flex items-center gap-1 hover:text-flipkartBlue transition-colors font-medium h-full">
      {title} {options && <ChevronDown size={14} className="text-gray-400 group-hover:rotate-180 transition-transform" />}
    </Link>
    
    {options && (
      <div className="hidden group-hover:block absolute left-0 top-full bg-white shadow-xl rounded-b-sm border-t border-gray-100 min-w-[200px] z-50 py-1">
        {options.map((opt, idx) => (
          <Link 
            key={idx} 
            to={`/?category=${encodeURIComponent(opt)}`} 
            className="block px-5 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 hover:text-flipkartBlue border-b border-gray-50 last:border-none"
          >
            {opt}
          </Link>
        ))}
      </div>
    )}
  </div>
);

const Navbar = ({ onSearch }) => {
  const { cartItems, isLoggedIn, showAuthModal, setShowAuthModal, onLogout } = useCart();
  const { wishlistIds } = useWishlist();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const handleLogout = async () => {
    try { await logoutUser(); } catch (_) {}
    localStorage.removeItem('user');
    onLogout();
    navigate('/');
  };

  const handleSearch = (val) => {
    setSearchInput(val);
    if (onSearch) onSearch(val);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/?category=`); // Let home search query handle it via app state
  };

  const totalItems = cartItems?.length || 0;

  return (
    <>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <header className="sticky top-0 z-50 w-full">
        {/* --- BLUE MAIN HEADER --- */}
        <div className="bg-flipkartBlue text-white">
          <div className="max-w-[1248px] mx-auto flex items-center h-[56px] px-2 sm:px-4 gap-6">
            
            {/* Logo */}
            <Link to="/" className="flex flex-col flex-shrink-0 cursor-pointer min-w-[75px] items-end mt-1">
              <span className="text-[20px] font-bold italic leading-none hover:underline">Flipkart</span>
              <span className="text-[11px] text-gray-200 italic flex items-center mt-0.5 hover:underline">
                Explore <span className="text-yellow-400 font-bold ml-0.5 mr-0.5">Plus</span>
                <img src="https://static-assets-web.flixcart.com/www/linchpin/fk-cp-zion/img/plus_aef861.png" className="w-[10px] h-[10px]" alt="plus"/>
              </span>
            </Link>

            {/* Search Bar - Centers on Desktop */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-[550px] relative hidden sm:flex items-center rounded-sm shadow-md bg-white h-[36px]">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search for products, brands and more"
                className="w-full text-black text-[14px] px-4 py-2 outline-none rounded-sm bg-white placeholder-gray-500 font-normal"
              />
              <button type="submit" className="absolute right-0 top-0 h-full px-3 text-flipkartBlue font-bold rounded-r-sm cursor-pointer hover:bg-gray-50">
                <Search size={20} strokeWidth={2.5}/>
              </button>
            </form>

            {/* Right Side Links */}
            <div className="flex items-center ml-auto gap-7 text-[15px] font-medium whitespace-nowrap">
              
              {/* User Dropdown */}
              {isLoggedIn && user ? (
                <div className="group relative cursor-pointer h-full py-4 flex items-center">
                  <div className="flex items-center gap-1 hover:text-white/90">
                    <span className="max-w-[120px] truncate capitalize">{user.firstName || user.email?.split('@')[0] || 'User'}</span>
                    <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
                  </div>
                  
                  {/* Dropdown Menu */}
                  <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-[56px] w-[240px] z-50">
                    <div className="bg-white text-black shadow-lg rounded-b-sm border-t border-gray-100 flex flex-col text-[14px] relative">
                      {/* Arrow clip */}
                      <div className="absolute -top-[6px] left-[50%] ml-[-3px] w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-white"></div>
                      
                      <div className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 border-b cursor-pointer">
                         <span className="font-semibold text-gray-800">New Customer?</span>
                         <span className="text-flipkartBlue font-bold text-[13px]">Sign Up</span>
                      </div>
                      <Link to="/account/profile" className="flex items-center px-4 py-3 hover:bg-gray-50 border-b">
                         <User size={16} className="mr-3 text-flipkartBlue"/> My Profile
                      </Link>
                      <Link to="/orders" className="flex items-center px-4 py-3 hover:bg-gray-50 border-b">
                         <ClipboardList size={16} className="mr-3 text-flipkartBlue" /> Orders
                      </Link>
                      <Link to="/wishlist" className="flex items-center px-4 py-3 hover:bg-gray-50 border-b">
                         <Heart size={16} className="mr-3 text-flipkartBlue" /> Wishlist
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-3 hover:bg-gray-50 text-gray-700">
                         <LogOut size={16} className="mr-3 text-flipkartBlue" /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-white text-flipkartBlue font-bold px-10 py-[4px] rounded-sm shadow-sm text-[15px]"
                >
                  Login
                </button>
              )}

              <span className="hidden lg:block cursor-pointer hover:text-white/90">Become a Seller</span>

              {/* More Dropdown */}
              <div className="group relative cursor-pointer hidden md:flex items-center h-full py-4">
                <div className="flex items-center gap-1 hover:text-white/90">
                  <span>More</span>
                  <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
                </div>
                {/* Dropdown Menu */}
                <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-[56px] w-[220px] z-50">
                  <div className="bg-white text-black shadow-lg rounded-b-sm border-t border-gray-100 flex flex-col text-[14px] relative">
                    <div className="absolute -top-[6px] left-[50%] ml-[-3px] w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-white"></div>
                    
                    <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-50 border-b">
                       <Bell size={16} className="mr-3 text-flipkartBlue"/> Notification Preferences
                    </a>
                    <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-50 border-b">
                       <HelpCircle size={16} className="mr-3 text-flipkartBlue"/> 24x7 Customer Care
                    </a>
                    <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-50 border-b">
                       <TrendingUp size={16} className="mr-3 text-flipkartBlue"/> Advertise
                    </a>
                    <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-50">
                       <Download size={16} className="mr-3 text-flipkartBlue"/> Download App
                    </a>
                  </div>
                </div>
              </div>

              {/* Cart */}
              <Link to="/cart" className="flex items-center cursor-pointer hover:text-white/90 tracking-wide font-bold">
                <div className="relative mr-2">
                  <ShoppingCart size={20} strokeWidth={2.5} />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-bold px-1.5 py-[1px] rounded-full leading-none border border-flipkartBlue">
                      {totalItems}
                    </span>
                  )}
                </div>
                Cart
              </Link>

            </div>
          </div>
        </div>

        {/* --- WHITE SUB NAV (Categories) --- */}
        <div className="hidden md:block bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-[1248px] mx-auto flex items-center h-[40px] px-4 gap-8 text-[14px] text-gray-700">
             <SubNavCat title="Electronics" options={['Laptops', 'Mobile Accessories', 'Audio', 'Cameras']} />
             <SubNavCat title="TVs & Appliances" options={['Televisions', 'Kitchen Appliances', 'Home Appliances']} />
             <SubNavCat title="Men" options={["Men's Fashion", "Men's Shoes", "Mens Watches", "Clothing"]} />
             <SubNavCat title="Women" options={['Beauty', 'Fragrances', 'Women Dresses']} />
             <SubNavCat title="Baby & Kids" options={['Toys', 'Kids Clothing']} />
             <SubNavCat title="Home & Furniture" options={['Furniture', 'Home Decoration', 'Kitchen Accessories']} />
             <SubNavCat title="Sports, Books & More" options={['Books', 'Sports Equipments']} />
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
