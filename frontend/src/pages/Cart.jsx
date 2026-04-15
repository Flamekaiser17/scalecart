import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';

const Cart = () => {
  const { cartItems, cartLoading, updateQuantity, removeFromCart, isLoggedIn, setShowAuthModal } = useCart();
  const navigate = useNavigate();

  // ── Price Calculations ─────────────────────────────────────────────────────
  // subtotal = sum of (unit price × quantity) for each item
  const subtotal  = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  // mrpTotal = what user would have paid without any discount
  // mrpPrice stored on item is already the discounted price; originalPrice = price / (1 - disc/100)
  // Since we don't have originalPrice in cart items, we approximate savings = 0 if unknown
  // But we DO know delivery is free (saved ₹40), so savings = ₹40 minimum
  const deliverySavings = 40;
  const totalAmount = subtotal; // delivery is free

  if (cartLoading && cartItems.length === 0) {
    return <Loader />;
  }

  // NOT logged in → prompt to login
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

  return (
    <div className="flex flex-col lg:flex-row gap-4 mt-4">

      {/* ── Left Column — Cart Items ── */}
      <div className="w-full lg:w-8/12 flex flex-col space-y-4">

        {/* Header */}
        <div className="bg-white p-4 shadow-sm flex items-center justify-between">
          <h2 className="text-lg font-medium">
            My Cart <span className="text-gray-500 font-normal text-sm">({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
          </h2>
          <div className="text-sm font-medium">
            Deliver to: <span className="font-bold underline text-flipkartBlue cursor-pointer">Select Delivery Location</span>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white shadow-sm px-2">
          {cartItems.map((item, index) => {
            // Per-item subtotal = unit price × quantity
            const itemSubtotal = (item.price || 0) * (item.quantity || 1);

            return (
              <div key={item.productId || index} className="p-4 border-b border-gray-100 flex flex-col sm:flex-row relative">

                {/* Left — Image + Qty Controls */}
                <div className="w-full sm:w-1/4 flex flex-col items-center">
                  <Link to={`/product/${item.productId}`} className="h-28 w-28 mb-4 block">
                    <img src={item.image} alt={item.name} className="h-full w-full object-contain hover:opacity-90" />
                  </Link>

                  {/* Quantity Controller — Flipkart style */}
                  <div className="flex items-center space-x-2">
                    <button
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-xl font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-40"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="text"
                      className="w-12 h-7 border border-gray-300 text-center text-sm font-medium outline-none"
                      value={item.quantity}
                      readOnly
                    />
                    <button
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-xl font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-40"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      // FIX: Cap at available stock if known, otherwise allow up to 10
                      disabled={item.quantity >= (item.stock || 10)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Right — Product Info */}
                <div className="w-full sm:w-3/4 sm:pl-6 mt-4 sm:mt-0 flex flex-col">
                  <Link to={`/product/${item.productId}`}>
                    <h3 className="text-base text-gray-900 hover:text-flipkartBlue line-clamp-2">{item.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    Seller: RetailNet
                    <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png" alt="assured" className="inline h-4 ml-1" />
                  </p>

                  {/* Price block — unit price + subtotal */}
                  <div className="mt-3 flex items-baseline flex-wrap gap-2">
                    <span className="text-lg font-bold">
                      ₹{Math.floor(item.price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-gray-400">per unit</span>
                    {item.quantity > 1 && (
                      <span className="text-sm font-semibold text-gray-700">
                        = <span className="text-flipkartBlue">₹{Math.floor(itemSubtotal).toLocaleString('en-IN')}</span>
                        <span className="text-gray-400 font-normal ml-1">subtotal</span>
                      </span>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="mt-6 flex font-semibold text-gray-800 space-x-6 text-sm uppercase">
                    <span className="hover:text-flipkartBlue cursor-pointer">Save for later</span>
                    <span
                      onClick={() => removeFromCart(item.productId)}
                      className="hover:text-red-500 cursor-pointer"
                    >
                      Remove
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Sticky Place Order Footer */}
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

      {/* ── Right Column — Price Summary ── */}
      <div className="w-full lg:w-4/12 h-fit">
        <div className="bg-white shadow-sm sticky top-20">

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-gray-500 font-bold uppercase tracking-wide text-sm">Price Details</h3>
          </div>

          {/* Breakdown */}
          <div className="px-6 py-4 font-normal text-gray-800 space-y-4 border-b border-gray-100 border-dashed">

            {/* Per-item breakdown */}
            {cartItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-600">
                <span className="line-clamp-1 max-w-[60%]">{item.name} × {item.quantity}</span>
                <span>₹{Math.floor((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
              </div>
            ))}

            <div className="border-t border-dashed pt-3 space-y-3">
              <div className="flex justify-between">
                <span>Price ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                <span>₹{Math.floor(subtotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="text-green-600">- ₹0</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="text-green-600 text-sm">
                  <span className="line-through text-gray-400 mr-1">₹{deliverySavings}</span>
                  FREE
                </span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="px-6 py-4 flex justify-between font-bold text-lg border-b border-gray-100 border-dashed">
            <span>Total Amount</span>
            <span>₹{Math.floor(totalAmount).toLocaleString('en-IN')}</span>
          </div>

          {/* Savings Message */}
          <div className="px-6 py-4 text-green-600 font-bold text-sm">
            You will save ₹{deliverySavings} on this order
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-4 flex items-center justify-center p-3 text-gray-500 font-bold text-sm bg-white shadow-sm">
          <span className="w-6 h-6 mr-2 outline outline-2 outline-gray-400 text-center rounded-full flex justify-center text-gray-400">?</span>
          Safe and Secure Payments. Easy returns. 100% Authentic products.
        </div>
      </div>

    </div>
  );
};

export default Cart;
