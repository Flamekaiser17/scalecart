import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';
import { ShieldCheck } from 'lucide-react';

const Cart = () => {
  const { cartItems, cartLoading, updateQuantity, removeFromCart, isLoggedIn, setShowAuthModal } = useCart();
  const navigate = useNavigate();

  // Price calculations
  const subtotal = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  const deliverySavings = 40;
  const totalAmount = subtotal;

  if (cartLoading && cartItems.length === 0) {
    return <Loader type="spinner" />;
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="fk-container mt-4">
        <div className="flex flex-col items-center justify-center py-16 bg-white shadow-sm">
          <img src="https://rukminim2.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png?q=90" alt="Empty cart" className="w-48 mb-6" />
          <h2 className="text-[18px] font-medium text-[#212121] mb-2">Missing Cart items?</h2>
          <p className="text-[14px] text-[#878787] mb-6">Login to see the items you added previously</p>
          <button onClick={() => setShowAuthModal(true)} className="px-16 py-3 bg-flipkartOrange text-white font-medium rounded-sm text-[14px] shadow-sm hover:shadow cursor-pointer">
            Login
          </button>
        </div>
      </div>
    );
  }

  // Empty cart
  if (cartItems.length === 0) {
    return (
      <div className="fk-container mt-4">
        <div className="flex flex-col items-center justify-center py-16 bg-white shadow-sm">
          <img src="https://rukminim2.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png?q=90" alt="Empty cart" className="w-48 mb-6" />
          <h2 className="text-[18px] font-medium text-[#212121] mb-2">Your cart is empty!</h2>
          <p className="text-[14px] text-[#878787] mb-6">Add items to it now.</p>
          <Link to="/" className="px-16 py-3 bg-flipkartBlue text-white font-medium rounded-sm text-[14px] shadow-sm hover:shadow">
            Shop now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fk-container">
      <div className="flex flex-col lg:flex-row gap-3 mt-3">

        {/* Left — Cart Items */}
        <div className="w-full lg:w-[67%] flex flex-col">
          
          {/* Header */}
          <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between">
            <h2 className="text-[18px] font-medium text-[#212121]">
              My Cart <span className="text-[14px] text-[#878787] font-normal">({cartItems.length})</span>
            </h2>
            <p className="text-[14px] text-[#212121] hidden sm:block">
              Deliver to: <span className="font-bold text-flipkartBlue cursor-pointer hover:underline">Select Address</span>
            </p>
          </div>

          {/* Items List */}
          <div className="bg-white shadow-sm mt-0">
            {cartItems.map((item, index) => {
              const itemTotal = (item.price || 0) * (item.quantity || 1);
              return (
                <div key={item.productId || index} className="px-6 py-5 border-b border-[#f0f0f0] flex flex-col sm:flex-row gap-4">
                  
                  {/* Image + Qty */}
                  <div className="flex flex-col items-center gap-3 sm:w-[110px] shrink-0">
                    <Link to={`/product/${item.productId}`} className="w-[112px] h-[112px] flex items-center justify-center">
                      <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                    </Link>
                    {/* Quantity controller */}
                    <div className="flex items-center">
                      <button
                        className="w-[28px] h-[28px] rounded-full border border-[#c2c2c2] flex items-center justify-center text-[18px] font-medium text-[#212121] bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >−</button>
                      <span className="w-[40px] h-[28px] border-t border-b border-[#c2c2c2] flex items-center justify-center text-[14px] font-bold text-[#212121] bg-white mx-[-1px]">
                        {item.quantity}
                      </span>
                      <button
                        className="w-[28px] h-[28px] rounded-full border border-[#c2c2c2] flex items-center justify-center text-[18px] font-medium text-[#212121] bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= (item.stock || 10)}
                      >+</button>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <Link to={`/product/${item.productId}`}>
                      <h3 className="text-[16px] text-[#212121] hover:text-flipkartBlue line-clamp-2 leading-tight">{item.name}</h3>
                    </Link>
                    <p className="text-[14px] text-[#878787] mt-1">
                      Seller: RetailNet
                      <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png" alt="assured" className="inline h-[14px] ml-1.5 align-text-bottom" />
                    </p>

                    {/* Price */}
                    <div className="mt-3 flex items-baseline flex-wrap gap-x-3 gap-y-1">
                      <span className="text-[18px] font-bold text-[#212121]">
                        ₹{Math.floor(itemTotal).toLocaleString('en-IN')}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[13px] text-[#878787]">
                          (₹{Math.floor(item.price).toLocaleString('en-IN')} x {item.quantity})
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-6 text-[14px] font-medium uppercase">
                      <button className="text-[#212121] hover:text-flipkartBlue cursor-pointer">Save for later</button>
                      <button onClick={() => removeFromCart(item.productId)} className="text-[#212121] hover:text-red-500 cursor-pointer">Remove</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Place Order footer */}
            <div className="px-4 py-3 bg-white flex justify-end sticky bottom-0 z-10 shadow-[0_-1px_6px_rgba(0,0,0,0.06)] border-t">
              <button
                onClick={() => navigate('/checkout')}
                className="px-14 py-3.5 bg-flipkartOrange text-white font-semibold rounded-sm uppercase text-[14px] tracking-wide shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>

        {/* Right — Price Summary */}
        <div className="w-full lg:w-[33%] h-fit">
          <div className="bg-white shadow-sm sticky top-[100px]">
            
            {/* Header */}
            <div className="px-6 py-3 border-b">
              <h3 className="text-[#878787] font-bold uppercase text-[12px] tracking-widest">Price Details</h3>
            </div>

            {/* Breakdown */}
            <div className="px-6 py-4 space-y-3 text-[14px] text-[#212121] border-b border-dashed">
              <div className="flex justify-between">
                <span>Price ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</span>
                <span>₹{Math.floor(subtotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="text-[#388e3c]">- ₹0</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="text-[#388e3c]">
                  <span className="line-through text-[#878787] mr-1 text-[13px]">₹{deliverySavings}</span>
                  FREE
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="px-6 py-4 flex justify-between font-bold text-[16px] text-[#212121] border-b border-dashed">
              <span>Total Amount</span>
              <span>₹{Math.floor(totalAmount).toLocaleString('en-IN')}</span>
            </div>

            {/* Savings */}
            <div className="px-6 py-3 text-[#388e3c] font-bold text-[14px]">
              You will save ₹{deliverySavings} on this order
            </div>
          </div>

          {/* Trust Badge */}
          <div className="mt-3 flex items-center gap-2 p-3 text-[#878787] text-[12px] font-medium bg-white shadow-sm">
            <ShieldCheck size={18} className="text-[#878787] shrink-0" />
            Safe and Secure Payments. Easy returns. 100% Authentic products.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
