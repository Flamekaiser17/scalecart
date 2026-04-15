import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home as HomeIcon } from 'lucide-react';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, total, address, itemCount } = location.state || {};

  useEffect(() => {
    if (!orderId && !location.state) {
      const timer = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const displayOrderId = orderId || ('OD' + Date.now());

  const steps = [
    { label: 'Order Placed', icon: CheckCircle, done: true },
    { label: 'Processing', icon: Package, done: false },
    { label: 'Shipped', icon: Truck, done: false },
    { label: 'Delivered', icon: HomeIcon, done: false },
  ];

  return (
    <div className="fk-container mt-3 mb-8">

      {/* Success Banner */}
      <div className="bg-[#26a541] text-white px-6 py-5 shadow-sm flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shrink-0">
          <CheckCircle size={18} />
        </div>
        <div>
          <h1 className="text-[18px] font-bold">Order Placed Successfully!</h1>
          <p className="text-[14px] text-green-100 mt-0.5">Your order has been confirmed. Estimated delivery in 3-5 business days.</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white shadow-sm">

        {/* Summary Grid */}
        <div className="px-6 py-6 border-b border-[#f0f0f0]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Order ID', value: displayOrderId.slice(-10).toUpperCase(), mono: true },
              { label: 'Items', value: itemCount || '--' },
              { label: 'Total Paid', value: total ? `₹${Math.floor(total).toLocaleString('en-IN')}` : '--', green: true },
              { label: 'Delivery', value: 'FREE', green: true },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center p-3 bg-[#f5f5f5] rounded-sm text-center">
                <span className="text-[11px] text-[#878787] uppercase tracking-wider mb-1">{item.label}</span>
                <span className={`font-bold text-${item.mono ? '[12px]' : '[18px]'} ${item.green ? 'text-[#26a541]' : 'text-[#212121]'} ${item.mono ? 'font-mono' : ''} break-all`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Address + Rewards */}
        <div className="px-6 py-5 flex flex-col sm:flex-row gap-6 border-b border-[#f0f0f0]">
          <div className="flex-1">
            <h3 className="text-[11px] text-[#878787] font-bold uppercase tracking-wider mb-2">Delivery Address</h3>
            <p className="text-[14px] text-[#212121] leading-relaxed whitespace-pre-wrap">
              {address || 'Address not available'}
            </p>
          </div>
          <div className="sm:text-right flex flex-col items-start sm:items-end justify-center">
            <div className="bg-[#fff8e1] border border-[#ffe082] px-5 py-3 rounded-sm text-center">
              <p className="font-bold text-[#f57f17] text-[14px]">+100 SuperCoins</p>
              <p className="text-[12px] text-[#878787] mt-0.5">Credited to your account</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-6 border-b border-[#f0f0f0]">
          <h3 className="text-[11px] text-[#878787] font-bold uppercase tracking-wider mb-5">Order Status</h3>
          <div className="flex items-center justify-between relative">
            {/* Background line */}
            <div className="absolute top-4 left-8 right-8 h-[2px] bg-[#e0e0e0]"></div>
            {/* Active line */}
            <div className="absolute top-4 left-8 h-[2px] bg-[#26a541]" style={{ width: '8%' }}></div>
            
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex flex-col items-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step.done ? 'bg-[#26a541] border-[#26a541] text-white' : 'bg-white border-[#e0e0e0] text-[#c2c2c2]'}`}>
                    <Icon size={14} />
                  </div>
                  <span className={`mt-2 text-[12px] text-center whitespace-nowrap ${step.done ? 'text-[#26a541] font-semibold' : 'text-[#878787]'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-10 py-3 bg-flipkartBlue text-white font-medium text-[14px] uppercase rounded-sm hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
          <p className="text-[12px] text-[#878787]">
            Full Order ID: <span className="font-mono text-[#212121]">{displayOrderId}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
