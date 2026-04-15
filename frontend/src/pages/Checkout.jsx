import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { checkoutOrder, fetchAddresses } from '../services/api';
import { ShieldCheck, Check, Plus } from 'lucide-react';

const STEPS = ['LOGIN', 'DELIVERY ADDRESS', 'ORDER SUMMARY', 'PAYMENT OPTIONS'];

const Checkout = () => {
  const { cartItems, loadCart, isLoggedIn, setShowAuthModal } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');

  const [address, setAddress] = useState({
    name: '', phone: '', pincode: '', city: '', state: '', addressLine: '',
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    const getAddresses = async () => {
      try {
        const res = await fetchAddresses();
        const addressesList = res.addresses || [];
        setSavedAddresses(addressesList);
        
        const defaultAddr = addressesList.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (addressesList.length > 0) {
          setSelectedAddressId(addressesList[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch saved addresses:", err);
      }
    };
    getAddresses();
  }, [isLoggedIn]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setAddress({ ...address, [name]: value });

    // Auto-fetch State and City from pincode
    if (name === 'pincode' && value.length === 6 && /^\d+$/.test(value)) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await response.json();
        if (data && data[0].Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          setAddress(prev => ({ ...prev, pincode: value, state: postOffice.State, city: postOffice.District }));
        }
      } catch (error) {
        console.error("Failed to fetch location data", error);
      }
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    if (cartItems.length === 0) { return setError('Your cart is empty!'); }

    try {
      setLoading(true);
      
      let shippingAddressStr = '';

      if (selectedAddressId === 'new') {
        if (!address.name || !address.phone || !address.pincode || !address.city || !address.state || !address.addressLine) {
           throw new Error('Please fill all required address fields.');
        }
        shippingAddressStr = `${address.name}, ${address.addressLine}, ${address.city}, ${address.state} - ${address.pincode}, Phone: ${address.phone}`;
      } else {
        const selected = savedAddresses.find(a => a.id === selectedAddressId);
        if (!selected) throw new Error('Selected address not found.');
        shippingAddressStr = `${selected.name}, ${selected.street}, ${selected.city}, ${selected.state} - ${selected.postalCode}, Phone: ${selected.phoneNumber}`;
      }

      const res = await checkoutOrder({ shippingAddress: shippingAddressStr });
      const orderData = res.data || res;
      await loadCart();
      navigate('/success', {
        state: { orderId: orderData._id, total, address: shippingAddressStr, itemCount: cartItems.length }
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="fk-container mt-4">
        <div className="flex flex-col items-center justify-center py-16 bg-white shadow-sm">
          <img src="https://rukminim2.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png?q=90" alt="Empty cart" className="w-48 mb-6" />
          <h2 className="text-[18px] font-medium text-[#212121] mb-2">Your cart is empty</h2>
          <button onClick={() => navigate('/')} className="mt-4 px-10 py-2.5 bg-flipkartBlue text-white font-medium rounded-sm text-[14px] cursor-pointer">
            Shop Now
          </button>
        </div>
      </div>
    );
  }

  const userEmail = (() => { try { return JSON.parse(localStorage.getItem('user'))?.email || 'Guest'; } catch { return 'Guest'; } })();

  const inputCls = "w-full p-3 border border-[#e0e0e0] bg-white outline-none focus:border-flipkartBlue text-[14px] rounded-sm transition-colors";

  return (
    <div className="fk-container">
      <div className="flex flex-col lg:flex-row gap-3 mt-3">

        {/* Left — Checkout Steps */}
        <div className="w-full lg:w-[67%] flex flex-col gap-1">

          {/* Step 1: Login (completed) */}
          <div className="bg-white shadow-sm">
            <div className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-[22px] h-[22px] bg-[#f0f0f0] text-[#878787] text-[11px] flex items-center justify-center font-bold rounded-sm">1</span>
                <div>
                  <h3 className="text-[12px] text-[#878787] uppercase tracking-wider font-medium">{STEPS[0]}</h3>
                  <p className="text-[14px] font-bold text-[#212121] mt-0.5">{userEmail}</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#26a541] flex items-center justify-center">
                <Check size={12} className="text-white" strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Step 2: Delivery Address (active) */}
          <div className="bg-white shadow-sm">
            <div className="bg-flipkartBlue text-white px-4 py-2.5 flex items-center gap-3">
              <span className="w-[22px] h-[22px] bg-white text-flipkartBlue text-[11px] flex items-center justify-center font-bold rounded-sm">2</span>
              <h3 className="text-[12px] uppercase tracking-wider font-medium">{STEPS[1]}</h3>
            </div>

            <div className="bg-[#f5faff] px-6 py-5 border-x border-b border-[#e4e4e4]">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCheckout} className="space-y-4">
                
                {/* Render Saved Addresses */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-3 mb-4 mt-2">
                    {savedAddresses.map((addr) => (
                      <label key={addr.id} className={`flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'bg-[#f5faff] border-flipkartBlue cursor-default' : 'bg-white border-[#f0f0f0] hover:border-flipkartBlue'}`}>
                        <input 
                           type="radio" 
                           name="delivery_address" 
                           className="mt-1 w-4 h-4 text-flipkartBlue"
                           checked={selectedAddressId === addr.id}
                           onChange={() => setSelectedAddressId(addr.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[14px] text-[#212121]">{addr.name}</span>
                            <span className="text-[12px] font-bold text-[#878787] uppercase bg-white border border-[#e0e0e0] px-2 py-0.5 rounded-sm">{addr.phoneNumber}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm font-bold uppercase">Default</span>
                            )}
                          </div>
                          <p className="text-[13px] text-[#212121] mt-1.5 line-clamp-2 leading-relaxed">
                             {addr.street}, {addr.city}, {addr.state} - <span className="font-bold">{addr.postalCode}</span>
                          </p>
                          {selectedAddressId === addr.id && (
                             <div className="mt-4 pt-2">
                               <button
                                  type="submit"
                                  disabled={loading}
                                  className="px-10 py-3 bg-flipkartOrange text-white font-semibold uppercase text-[14px] rounded-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer tracking-wide"
                               >
                                  {loading ? 'Processing...' : 'DELIVER HERE'}
                               </button>
                             </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Add New Address Option */}
                {savedAddresses.length > 0 && (
                  <label className="flex items-center gap-3 p-4 border border-[#f0f0f0] bg-white rounded-sm cursor-pointer hover:border-flipkartBlue mb-4">
                     <input 
                        type="radio" 
                        name="delivery_address" 
                        className="w-4 h-4 text-flipkartBlue focus:ring-flipkartBlue"
                        checked={selectedAddressId === 'new'}
                        onChange={() => setSelectedAddressId('new')}
                     />
                     <Plus size={16} className="text-flipkartBlue" />
                     <span className="text-[14px] font-bold text-flipkartBlue uppercase">Add a new address</span>
                  </label>
                )}

                {/* Manual Form (Shown if selected or if no saved addresses) */}
                {selectedAddressId === 'new' && (
                  <div className={savedAddresses.length > 0 ? "ml-0 sm:ml-7 p-5 border border-[#e0e0e0] bg-[#fafafa] rounded-sm" : ""}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <input required={selectedAddressId === 'new'} type="text" name="name" value={address.name} onChange={handleChange} placeholder="Full Name *" className={inputCls} />
                      <input required={selectedAddressId === 'new'} type="tel" name="phone" value={address.phone} onChange={handleChange} placeholder="10-digit Mobile Number *" pattern="[0-9]{10}" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <input required={selectedAddressId === 'new'} type="text" name="pincode" value={address.pincode} onChange={handleChange} placeholder="Pincode *" maxLength={6} className={inputCls} />
                      <input required={selectedAddressId === 'new'} type="text" name="city" value={address.city} onChange={handleChange} placeholder="City / District *" className={inputCls} />
                    </div>
                    <input required={selectedAddressId === 'new'} type="text" name="state" value={address.state} onChange={handleChange} placeholder="State *" className={`mb-4 ${inputCls}`} />
                    <textarea required={selectedAddressId === 'new'} name="addressLine" value={address.addressLine} onChange={handleChange} rows={3} placeholder="House No, Building, Street, Area *" className={`mb-4 ${inputCls} resize-none`} />
                    
                    <div className="pt-2 border-t border-[#e0e0e0] w-full text-right sm:text-left pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-10 py-3 bg-flipkartOrange text-white font-semibold uppercase text-[14px] rounded-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer tracking-wide"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            Processing...
                          </span>
                        ) : 'SAVE AND DELIVER HERE'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Step 3: Order Summary (collapsed) */}
          <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
            <span className="w-[22px] h-[22px] bg-[#f0f0f0] text-[#878787] text-[11px] flex items-center justify-center font-bold rounded-sm">3</span>
            <h3 className="text-[12px] text-[#878787] uppercase tracking-wider font-medium">{STEPS[2]}</h3>
          </div>

          {/* Step 4: Payment (collapsed) */}
          <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
            <span className="w-[22px] h-[22px] bg-[#f0f0f0] text-[#878787] text-[11px] flex items-center justify-center font-bold rounded-sm">4</span>
            <h3 className="text-[12px] text-[#878787] uppercase tracking-wider font-medium">{STEPS[3]}</h3>
          </div>
        </div>

        {/* Right — Price Summary */}
        <div className="w-full lg:w-[33%] h-fit">
          <div className="bg-white shadow-sm sticky top-[100px]">
            <div className="px-6 py-3 border-b">
              <h3 className="text-[#878787] font-bold uppercase text-[12px] tracking-widest">Price Details</h3>
            </div>

            <div className="px-6 py-4 space-y-3 text-[14px] text-[#212121] border-b border-dashed">
              <div className="flex justify-between">
                <span>Price ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</span>
                <span>₹{Math.floor(total).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="text-[#388e3c]">- ₹0</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="text-[#388e3c]">
                  <span className="line-through text-[#878787] mr-1 text-[13px]">₹40</span>Free
                </span>
              </div>
            </div>

            <div className="px-6 py-4 flex justify-between font-bold text-[16px] text-[#212121] border-b border-dashed">
              <span>Total Payable</span>
              <span>₹{Math.floor(total).toLocaleString('en-IN')}</span>
            </div>

            <div className="px-6 py-3 text-[#388e3c] font-bold text-[14px]">
              You will save ₹40 on this order
            </div>

            {/* Cart preview */}
            <div className="border-t px-6 py-4">
              <p className="text-[11px] text-[#878787] font-bold uppercase tracking-wider mb-3">Order Items ({cartItems.length})</p>
              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {cartItems.map((item, i) => (
                  <div key={item.productId || i} className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-contain border rounded-sm shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#212121] line-clamp-1">{item.name}</p>
                      <p className="text-[12px] font-bold text-[#212121]">₹{Math.floor(item.price).toLocaleString('en-IN')} x {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 p-3 text-[#878787] text-[12px] font-medium bg-white shadow-sm">
            <ShieldCheck size={18} className="text-[#878787] shrink-0" />
            Safe and Secure Payments. Easy returns. 100% Authentic products.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
