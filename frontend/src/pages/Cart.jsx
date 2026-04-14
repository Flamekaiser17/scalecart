import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';

const Cart = () => {
  const { cartItems, cartLoading, updateQuantity, removeFromCart, isLoggedIn, setShowAuthModal } = useCart();
  const navigate = useNavigate();

  // Derived total — always in sync since it recalculates when cartItems changes
  const total = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  if (cartLoading && cartItems.length === 0) {
    return <Loader />;
  }

  // NOT logged in → prompt to login instead of showing empty cart
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white shadow-sm mt-4 min-h-[500px]">
        <span className="text-6xl mb-4">🔒</span>
        <h2 className="text-xl font-medium mb-2">Please login to view your cart</h2>
        <p className="text-sm text-gray-500 mb-6">Your cart items are saved securely to your account.</p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-12 py-3 bg-flipkartBlue text-white shadow font-medium rounded-sm text-sm"
        >
          Login / Register
        </button>
      </div>
    );
  }

  // Logged in but cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white shadow-sm mt-4 min-h-[500px]">
        <img
          src="https://rukminim2.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png?q=90"
          alt="Empty cart"
          className="w-56 mb-6"
        />
        <h2 className="text-xl font-medium mb-2">Your cart is empty!</h2>
        <p className="text-sm text-gray-500 mb-6">Add items to it now.</p>
        <Link to="/" className="px-16 py-3 bg-flipkartBlue text-white shadow font-medium rounded-sm">
          Shop now
        </Link>
      </div>
    );
  }

  // Flipkart Cart consists of: Price tracking, fixed 2 column layout, horizontal product split
  return (
    <div className="flex flex-col lg:flex-row gap-4 mt-4">
      {/* Left Column - Cart Items */}
      <div className="w-full lg:w-8/12 flex flex-col space-y-4">
        {/* FlipKart style header */}
        <div className="bg-white p-4 shadow-sm flex items-center justify-between shadow-sm">
           <h2 className="text-lg font-medium">Flipkart ({cartItems.length})</h2>
           <div className="text-sm font-medium">
              Deliver to: <span className="font-bold underline text-flipkartBlue cursor-pointer">Select Delivery Location</span>
           </div>
        </div>

        {/* Item List mapped out */}
        <div className="bg-white shadow-sm px-2">
            {cartItems.map((item, index) => (
                <div key={item.productId || index} className="p-4 border-b border-gray-100 flex flex-col sm:flex-row relative">
                   {/* Product Left - Image & Quantities */}
                   <div className="w-full sm:w-1/4 flex flex-col items-center">
                      <div className="h-28 w-28 mb-4">
                        <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                      </div>
                      
                      {/* Quantity Controller styled heavily like flipkart */}
                      <div className="flex items-center space-x-2">
                         <button 
                           className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-xl font-medium bg-gray-50 hover:bg-gray-100"
                           onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                           disabled={item.quantity <= 1}
                         >
                           -
                         </button>
                         <input type="text" className="w-12 h-7 border border-gray-300 text-center text-sm font-medium outline-none" value={item.quantity} readOnly />
                         <button 
                           className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-xl font-medium bg-gray-50 hover:bg-gray-100"
                           onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                         >
                           +
                         </button>
                      </div>
                   </div>

                   {/* Product Right - Info */}
                   <div className="w-full sm:w-3/4 sm:pl-6 mt-4 sm:mt-0 flex flex-col">
                       <h3 className="text-base text-gray-900 line-clamp-1">{item.name}</h3>
                       <p className="text-sm text-gray-500 mt-1">Seller: FkAssured Seller <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png" alt="assur" className="inline h-4 ml-1"/></p>
                       
                       <div className="mt-3 flex items-baseline space-x-2">
                          <span className="text-lg font-bold">₹{item.price.toLocaleString('en-IN')}</span>
                          <span className="text-sm text-green-600 font-medium whitespace-nowrap hidden sm:inline">16% Off 2 offers applied</span>
                       </div>

                       {/* Action Footer Space row inside card */}
                       <div className="mt-6 flex font-semibold text-gray-800 space-x-6 cursor-pointer hover:text-flipkartBlue uppercase text-sm">
                           <span className="hover:text-flipkartBlue">Save for later</span>
                           <span onClick={() => removeFromCart(item.productId)} className="hover:text-flipkartBlue">Remove</span>
                       </div>
                   </div>
                </div>
            ))}

            {/* Footer Place Order Anchor */}
            <div className="p-4 shadow-[0_-2px_10px_-5px_rgba(0,0,0,0.2)] bg-white flex justify-end sticky bottom-0 z-10 w-full">
               <button 
                 onClick={() => navigate('/checkout')}
                 className="px-14 py-3 bg-flipkartOrange text-white font-medium shadow rounded-sm uppercase tracking-wide hover:shadow-lg"
               >
                 Place Order
               </button>
            </div>
        </div>
      </div>

      {/* Right Column - Price Details Widget */}
      <div className="w-full lg:w-4/12 h-fit relative">
         <div className="bg-white shadow-sm sticky top-20">
             <div className="px-6 py-4 border-b border-gray-100">
               <h3 className="text-gray-500 font-bold uppercase tracking-wide">Price Details</h3>
             </div>
             
             <div className="px-6 py-4 font-normal text-gray-800 space-y-4 border-b border-gray-100 border-dashed">
                <div className="flex justify-between">
                  <span>Price ({cartItems.length} items)</span>
                  <span>₹{Math.floor(total).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="text-green-600">- ₹0</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="text-green-600 text-sm">
                     <span className="line-through text-gray-500 mr-1">₹40</span> Free
                  </span>
                </div>
             </div>

             <div className="px-6 py-4 flex justify-between font-bold text-lg border-b border-gray-100 border-dashed">
                <span>Total Amount</span>
                <span>₹{Math.floor(total).toLocaleString('en-IN')}</span>
             </div>

             <div className="px-6 py-4 text-green-600 font-bold text-sm tracking-wide">
                You will save ₹40 on this order
             </div>
         </div>
         
         <div className="mt-4 flex items-center justify-center p-3 text-gray-500 font-bold text-sm bg-white shadow-sm">
             <span className="w-6 h-6 mr-2 outline outline-2 outline-gray-400 text-center rounded-full flex justify-center text-gray-400">?</span> Safe and Secure Payments. Easy returns. 100% Authentic products.
         </div>
      </div>
    </div>
  );
};

export default Cart;
