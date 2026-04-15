import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Clock, MapPin, Mail } from 'lucide-react';
import { getUserOrders } from '../services/api';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';

const STATUS_COLORS = {
  Pending:    'bg-[#fff3e0] text-[#e65100]',
  Processing: 'bg-[#e3f2fd] text-[#1565c0]',
  Shipped:    'bg-[#f3e5f5] text-[#7b1fa2]',
  Delivered:  'bg-[#e8f5e9] text-[#2e7d32]',
  Cancelled:  'bg-[#ffebee] text-[#c62828]',
};

const Orders = () => {
  const { isLoggedIn, setShowAuthModal } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getUserOrders();
        setOrders(res.data || []);
      } catch (err) {
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="fk-container mt-4">
        <div className="flex flex-col items-center justify-center bg-white shadow-sm py-16">
          <Package className="w-14 h-14 text-[#d5d5d5] mb-4" strokeWidth={1.2} />
          <h2 className="text-[18px] font-medium text-[#212121] mb-2">Please login to view your Orders</h2>
          <p className="text-[14px] text-[#878787] mb-6">Track your orders and delivery status here.</p>
          <button onClick={() => setShowAuthModal(true)} className="px-12 py-3 bg-flipkartBlue text-white font-medium rounded-sm text-[14px] cursor-pointer">
            Login / Register
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <Loader type="spinner" />;

  if (error) return (
    <div className="fk-container mt-4">
      <div className="bg-white shadow-sm p-10 text-center text-red-500 text-[14px]">{error}</div>
    </div>
  );

  if (orders.length === 0) {
    return (
      <div className="fk-container mt-4">
        <div className="flex flex-col items-center justify-center bg-white shadow-sm py-16">
          <Package className="w-14 h-14 text-[#d5d5d5] mb-4" strokeWidth={1.2} />
          <h2 className="text-[18px] font-medium text-[#212121] mb-2">No orders yet!</h2>
          <p className="text-[14px] text-[#878787] mb-6">Your placed orders will appear here.</p>
          <Link to="/" className="px-12 py-3 bg-flipkartBlue text-white font-medium rounded-sm text-[14px]">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fk-container mt-3 mb-8">
      {/* Page Header */}
      <div className="bg-white shadow-sm px-5 py-3 flex items-center gap-2 mb-2">
        <Package className="w-[18px] h-[18px] text-flipkartBlue" />
        <h1 className="text-[16px] font-medium text-[#212121]">My Orders <span className="text-[14px] text-[#878787] font-normal">({orders.length})</span></h1>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {orders.map((order) => {
          const date = new Date(order.orderDate || order.createdAt);
          const statusClass = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600';

          return (
            <div key={order._id} className="bg-white shadow-sm hover:shadow transition-shadow">
              {/* Order Header */}
              <div className="px-5 py-3 border-b border-[#f0f0f0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-5 flex-wrap">
                  <div>
                    <p className="text-[11px] text-[#878787] uppercase tracking-wider">Order ID</p>
                    <p className="font-mono text-[12px] font-bold text-[#212121]">{order._id?.slice(-12).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#878787] uppercase tracking-wider">Date</p>
                    <p className="text-[12px] text-[#212121] flex items-center gap-1">
                      <Clock size={11} className="text-[#878787]" />
                      {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#878787] uppercase tracking-wider">Total</p>
                    <p className="text-[14px] font-bold text-[#212121]">₹{Math.floor(order.totalAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full self-start sm:self-center uppercase tracking-wide ${statusClass}`}>
                  {order.status}
                </span>
              </div>

              {/* Order Items */}
              <div className="px-5 py-3">
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item, i) => {
                      const productObj = item.productId || item;
                      const isPopulated = typeof productObj === 'object' && productObj !== null && productObj.name;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          {isPopulated && (
                            <img src={productObj.images?.[0]} alt={productObj.name} className="w-10 h-10 object-contain border rounded-sm shrink-0" />
                          )}
                          <p className="text-[13px] text-[#212121] line-clamp-1">
                            {isPopulated ? productObj.name : `Product #${String(productObj?._id || productObj).slice(-8)}`}
                          </p>
                        </div>
                      );
                    })}
                    {order.items.length > 3 && (
                      <p className="text-[12px] text-[#878787]">+{order.items.length - 3} more item(s)</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#878787]">Order items not available</p>
                )}

                {order.shippingAddress && (
                  <p className="text-[12px] text-[#878787] mt-2 pt-2 border-t border-[#f0f0f0] flex items-start gap-1">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    <span><span className="font-medium text-[#212121]">Ships to:</span> {order.shippingAddress}</span>
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-2.5 bg-[#fafafa] border-t border-[#f0f0f0] flex justify-between items-center">
                <span className="text-[12px] text-[#26a541] font-medium flex items-center gap-1">
                  <Mail size={12} /> Confirmation email sent
                </span>
                <button
                  onClick={() => navigate('/')}
                  className="text-[12px] text-flipkartBlue font-semibold flex items-center hover:underline cursor-pointer"
                >
                  Buy Again <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
