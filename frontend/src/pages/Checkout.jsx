import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { checkoutOrder } from '../services/api';

const Checkout = () => {
  const { cartItems, loadCart, isLoggedIn, setShowAuthModal } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Compute total from cartItems directly — always in sync (derived state pattern)
  const total = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  // Address form state — matches backend shippingAddress string
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    pincode: '',
    city: '',
    state: '',
    addressLine: '',
  });

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setAddress({ ...address, [name]: value });

    // Auto-fetch State and City if pincode is 6 digits
    if (name === 'pincode' && value.length === 6 && /^\d+$/.test(value)) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await response.json();
        if (data && data[0].Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          setAddress(prev => ({
            ...prev,
            pincode: value,
            state: postOffice.State,
            city: postOffice.District,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch location data", error);
      }
    }
  };

  // PLACE ORDER handler
  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');

    // Guard: user must be logged in
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    // Guard: cart must not be empty
    if (cartItems.length === 0) {
      return setError('Your cart is empty!');
    }

    try {
      setLoading(true);

      // Build shippingAddress string from form fields
      // Backend order controller reads: req.body.shippingAddress (string)
      const shippingAddress = `${address.name}, ${address.addressLine}, ${address.city}, ${address.state} - ${address.pincode}, Phone: ${address.phone}`;

      const res = await checkoutOrder({ shippingAddress });

      // Extract order data from response
      const orderData = res.data || res;

      // Sync cart to empty state after successful order
      await loadCart();

      // Navigate to success page, passing order details via router state
      navigate('/success', {
        state: {
          orderId: orderData._id,
          total: total,
          address: shippingAddress,
          itemCount: cartItems.length,
        }
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Checkout failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // If cart is empty, redirect home
  if (cartItems.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white shadow-sm mt-4 min-h-[400px]">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="mt-4 px-8 py-2.5 bg-flipkartBlue text-white font-medium">
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 mt-4 max-w-7xl mx-auto px-4">

      {/* ---- Left Column: Checkout Steps ---- */}
      <div className="w-full lg:w-8/12 flex flex-col space-y-3">

        {/* Step 1: Login Info (static display) */}
        <div className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="w-6 h-6 bg-blue-100 text-flipkartBlue text-xs flex items-center justify-center font-bold">1</span>
            <div>
              <h3 className="font-medium text-gray-400 uppercase text-xs tracking-wide">Login</h3>
              <p className="font-bold text-sm text-gray-800">
                {(() => { try { return JSON.parse(localStorage.getItem('user'))?.email || 'Guest'; } catch { return 'Guest'; } })()}
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Step 2: Delivery Address — Active Step (highlighted in blue) */}
        <div>
          <div className="bg-flipkartBlue text-white p-3.5 flex items-center">
            <span className="w-6 h-6 bg-white text-flipkartBlue text-xs flex items-center justify-center font-bold mr-3">2</span>
            <h3 className="font-medium uppercase text-sm tracking-wide">Delivery Address</h3>
          </div>

          <div className="bg-blue-50 px-6 py-5 border border-blue-100">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCheckout} className="flex flex-col gap-4">
              {/* Row 1: Name + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  name="name"
                  value={address.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="p-3 border bg-white outline-none focus:border-flipkartBlue text-sm rounded-sm"
                />
                <input
                  required
                  type="tel"
                  name="phone"
                  value={address.phone}
                  onChange={handleChange}
                  placeholder="10-digit Mobile Number"
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit phone number"
                  className="p-3 border bg-white outline-none focus:border-flipkartBlue text-sm rounded-sm"
                />
              </div>

              {/* Row 2: Pincode + City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  name="pincode"
                  value={address.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                  className="p-3 border bg-white outline-none focus:border-flipkartBlue text-sm rounded-sm"
                />
                <input
                  required
                  type="text"
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  placeholder="City / District / Town"
                  className="p-3 border bg-white outline-none focus:border-flipkartBlue text-sm rounded-sm"
                />
              </div>

              {/* State */}
              <input
                required
                type="text"
                name="state"
                value={address.state}
                onChange={handleChange}
                placeholder="State"
                className="p-3 border bg-white outline-none focus:border-flipkartBlue text-sm rounded-sm"
              />

              {/* Full Address */}
              <textarea
                required
                name="addressLine"
                value={address.addressLine}
                onChange={handleChange}
                rows={3}
                placeholder="Address (House No, Building, Street, Area)"
                className="p-3 border bg-white outline-none focus:border-flipkartBlue text-sm rounded-sm resize-none"
              />

              {/* Submit */}
              <div className="mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-3 bg-flipkartOrange text-white font-medium uppercase text-sm shadow hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Processing Order...
                    </span>
                  ) : '🛍️ Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Step 3: Order Summary (collapsed style) */}
        <div className="bg-white shadow-sm p-4 flex items-center border-b">
          <span className="w-6 h-6 bg-gray-100 text-gray-400 text-xs flex items-center justify-center font-bold mr-3">3</span>
          <h3 className="font-medium text-gray-400 uppercase text-xs tracking-wide">Order Summary</h3>
        </div>

        {/* Step 4: Payment (collapsed style) */}
        <div className="bg-white shadow-sm p-4 flex items-center">
          <span className="w-6 h-6 bg-gray-100 text-gray-400 text-xs flex items-center justify-center font-bold mr-3">4</span>
          <h3 className="font-medium text-gray-400 uppercase text-xs tracking-wide">Payment Options</h3>
        </div>
      </div>

      {/* ---- Right Column: Price Summary ---- */}
      <div className="w-full lg:w-4/12 h-fit">
        <div className="bg-white shadow-sm sticky top-20">
          
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest">Price Details</h3>
          </div>

          {/* Price Rows */}
          <div className="px-6 py-4 space-y-3 text-sm font-normal text-gray-800 border-b border-dashed">
            <div className="flex justify-between">
              <span>Price ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</span>
              <span>₹{Math.floor(total).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span className="text-green-600">− ₹0</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span className="text-green-600 flex items-center gap-1">
                <span className="line-through text-gray-400">₹40</span> Free
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="px-6 py-4 flex justify-between font-bold text-base border-b border-dashed">
            <span>Total Payable</span>
            <span>₹{Math.floor(total).toLocaleString('en-IN')}</span>
          </div>

          {/* Savings Note */}
          <div className="px-6 py-3 text-green-600 font-semibold text-sm">
            You will save ₹40 on this order 🎉
          </div>

          {/* Cart Items Preview */}
          <div className="border-t px-6 py-4">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-3">Items in Cart</p>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {cartItems.map((item, i) => (
                <div key={item.productId || i} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-10 h-10 object-contain border rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 line-clamp-1">{item.name}</p>
                    <p className="text-xs font-semibold">₹{Math.floor(item.price).toLocaleString('en-IN')} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safety notice */}
        <div className="mt-3 flex items-start p-3 text-gray-500 font-medium text-xs bg-white shadow-sm">
          <span className="mr-2 text-gray-400">🔒</span>
          Safe and Secure Payments. Easy returns. 100% Authentic products.
        </div>
      </div>
    </div>
  );
};

export default Checkout;
