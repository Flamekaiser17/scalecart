import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Order data passed from Checkout via router state
  const { orderId, total, address, itemCount } = location.state || {};

  // If someone navigates here directly with no order data, send home
  useEffect(() => {
    if (!orderId && !location.state) {
      // Small delay to avoid flash
      const timer = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Generate display-safe order ID
  const displayOrderId = orderId || ('OD' + Date.now());

  return (
    <div className="max-w-3xl mx-auto mt-4 px-4">

      {/* ✅ Success Banner */}
      <div className="bg-green-600 text-white px-6 py-5 shadow-sm flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center">
            <span className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center mr-3 text-sm shrink-0">✓</span>
            Order Placed Successfully! 🎉
          </h1>
          <p className="mt-1.5 text-green-100 text-sm pl-10">
            Your order has been confirmed. Estimated delivery in 3–5 business days.
          </p>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white shadow-sm border border-gray-100">

        {/* Order Details Row */}
        <div className="px-6 py-6 border-b">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded">
              <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order ID</span>
              <span className="font-bold text-xs text-gray-800 break-all">{displayOrderId.slice(-10)}</span>
            </div>

            <div className="flex flex-col items-center p-3 bg-gray-50 rounded">
              <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">Items</span>
              <span className="font-bold text-lg text-gray-800">{itemCount || '—'}</span>
            </div>

            <div className="flex flex-col items-center p-3 bg-gray-50 rounded">
              <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Paid</span>
              <span className="font-bold text-lg text-green-600">
                {total ? `₹${Math.floor(total).toLocaleString('en-IN')}` : '—'}
              </span>
            </div>

            <div className="flex flex-col items-center p-3 bg-gray-50 rounded">
              <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery</span>
              <span className="font-bold text-green-600 text-sm">FREE</span>
            </div>
          </div>
        </div>

        {/* Address + SuperCoins Row */}
        <div className="px-6 py-5 flex flex-col sm:flex-row gap-6 border-b">
          
          <div className="flex-1">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">Delivery Address</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {address || 'Address not available'}
            </p>
          </div>

          <div className="sm:text-right flex flex-col items-start sm:items-end justify-center">
            <div className="bg-yellow-50 border border-yellow-200 px-5 py-3 rounded text-center">
              <p className="text-2xl mb-1">🪙</p>
              <p className="font-bold text-yellow-700 text-sm">+100 SuperCoins</p>
              <p className="text-xs text-gray-500 mt-0.5">Credited to your account</p>
            </div>
          </div>
        </div>

        {/* Order Progress Bar (Flipkart style) */}
        <div className="px-6 py-5 border-b">
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-4">Order Status</h3>
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 mx-8"></div>
            <div className="absolute top-4 left-0 right-3/4 h-0.5 bg-green-500 mx-8"></div>
            
            {[
              { label: 'Order Placed', active: true, done: true },
              { label: 'Processing', active: false, done: false },
              { label: 'Shipped', active: false, done: false },
              { label: 'Delivered', active: false, done: false },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step.done ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <span className={`mt-2 text-xs text-center whitespace-nowrap ${step.done ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-10 py-3 bg-flipkartBlue text-white shadow font-medium text-sm uppercase rounded-sm hover:bg-blue-700"
          >
            Continue Shopping
          </button>
          <p className="text-xs text-gray-400 text-center sm:text-right">
            Full Order ID: <span className="font-mono text-gray-500">{displayOrderId}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
