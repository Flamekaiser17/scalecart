import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Clock } from 'lucide-react';
import { getUserOrders } from '../services/api';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';

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
        // Backend: { data: [...orders] }
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
      <div className="flex flex-col items-center justify-center bg-white shadow-sm mt-4 min-h-[500px] p-10">
        <Package className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-medium mb-2">Please login to view your Orders</h2>
        <p className="text-sm text-gray-500 mb-6">Track your orders and delivery status here.</p>
        <button onClick={() => setShowAuthModal(true)} className="px-12 py-3 bg-flipkartBlue text-white font-medium rounded-sm text-sm shadow">
          Login / Register
        </button>
      </div>
    );
  }

  if (loading) return <Loader />;

  if (error) return (
    <div className="bg-white mt-4 shadow-sm p-10 text-center text-red-500">{error}</div>
  );

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-white shadow-sm mt-4 min-h-[500px] p-10">
        <Package className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-medium mb-2">No orders yet!</h2>
        <p className="text-sm text-gray-500 mb-6">Your placed orders will appear here.</p>
        <Link to="/" className="px-12 py-3 bg-flipkartBlue text-white font-medium rounded-sm text-sm shadow">
          Start Shopping
        </Link>
      </div>
    );
  }

  const STATUS_COLORS = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Processing: 'bg-blue-100 text-blue-700',
    Shipped: 'bg-purple-100 text-purple-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 mt-4 mb-8">
      {/* Page Header */}
      <div className="bg-white shadow-sm px-6 py-4 border-b mb-3 flex items-center gap-3">
        <Package className="w-5 h-5 text-flipkartBlue" />
        <h1 className="text-lg font-medium">My Orders <span className="text-gray-500 font-normal text-sm">({orders.length})</span></h1>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.map((order) => {
          const date = new Date(order.orderDate || order.createdAt);
          const statusClass = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600';

          return (
            <div key={order._id} className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
                    <p className="font-mono text-xs font-semibold text-gray-700">{order._id?.slice(-12).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                    <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                      <Clock size={11} />
                      {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                    <p className="text-sm font-bold text-gray-900">₹{Math.floor(order.totalAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-center ${statusClass}`}>
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
                            <img src={productObj.images?.[0]} alt={productObj.name} className="w-10 h-10 object-contain border rounded" />
                          )}
                          <p className="text-sm text-gray-700 line-clamp-1">
                            {isPopulated ? productObj.name : `Product ID: ${String(productObj?._id || productObj).slice(-8)}`}
                          </p>
                        </div>
                      );
                    })}
                    {order.items.length > 3 && (
                      <p className="text-xs text-gray-500">+{order.items.length - 3} more item(s)</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Order items not available</p>
                )}

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                    📦 <span className="font-medium">Ships to:</span> {order.shippingAddress}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-2 bg-gray-50 border-t flex justify-between items-center">
                {/* Simulated email confirmation */}
                <span className="text-xs text-green-600 font-medium">
                  ✉️ Order confirmation email sent
                </span>
                <button
                  onClick={() => navigate('/')}
                  className="text-xs text-flipkartBlue font-semibold flex items-center hover:underline"
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
