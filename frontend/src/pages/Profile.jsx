import React, { useState, useEffect } from 'react';
import { User, ClipboardList, Heart, Power, Plus, Trash2, MapPin, ChevronRight, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { updateProfile, fetchAddresses, addAddress, deleteAddress } from '../services/api';
import Loader from '../components/Loader';

const Profile = () => {
    const { isLoggedIn, onLogout } = useCart();
    const navigate = useNavigate();
    
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ ...user });
    const [addresses, setAddresses] = useState([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        name: '', phoneNumber: '', pincode: '', city: '', state: '', street: '', isDefault: false
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/');
            return;
        }
        loadAddresses();
    }, [isLoggedIn]);

    const loadAddresses = async () => {
        try {
            const res = await fetchAddresses();
            setAddresses(res.addresses || []);
        } catch (err) {
            console.error("Failed to load addresses", err);
        }
    };

    const handleProfileUpdate = async () => {
        setLoading(true);
        try {
            const res = await updateProfile(formData);
            const updatedUser = res.data?.user || res.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setEditMode(false);
            showMsg("Profile updated successfully", "success");
        } catch (err) {
            showMsg("Failed to update profile", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePincodeChange = async (pincode) => {
        setNewAddress(prev => ({ ...prev, pincode }));
        if (pincode.length === 6 && /^\d+$/.test(pincode)) {
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                const data = await res.json();
                if (data && data[0]?.Status === 'Success') {
                    const po = data[0].PostOffice[0];
                    setNewAddress(prev => ({
                        ...prev,
                        pincode,
                        city: po.District,
                        state: po.State
                    }));
                }
            } catch (err) {
                console.error('Pincode lookup failed:', err);
            }
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: newAddress.name,
                phoneNumber: newAddress.phoneNumber,
                postalCode: newAddress.pincode,
                city: newAddress.city,
                state: newAddress.state,
                street: newAddress.street,
                country: 'India',
                isDefault: newAddress.isDefault
            };
            await addAddress(payload);
            
            // Reload addresses from backend so that if 'isDefault' was true, 
            // the previous default address gets correctly visually unset.
            await loadAddresses();

            setShowAddressForm(false);
            setNewAddress({ name: '', phoneNumber: '', pincode: '', city: '', state: '', street: '', isDefault: false });
            showMsg('Address saved successfully', 'success');
        } catch (err) {
            console.error('Add address error:', err);
            showMsg(err?.response?.data?.message || 'Failed to save address', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm("Delete this address?")) return;
        try {
            await deleteAddress(id);
            setAddresses(prev => prev.filter(a => a.id !== id));
            showMsg("Address removed", "success");
        } catch (err) {
            showMsg("Failed to remove address", "error");
        }
    };

    const showMsg = (text, type) => {
        setMsg({ text, type });
        setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        onLogout();
        navigate('/');
    };

    const SidebarItem = ({ icon: Icon, title, active, to }) => (
        <Link to={to} className={`flex items-center px-6 py-4 border-b border-[#f0f0f0] hover:bg-[#f5faff] group transition-colors ${active ? 'bg-[#f5faff] border-r-4 border-flipkartBlue' : ''}`}>
            <Icon size={18} className={`${active ? 'text-flipkartBlue' : 'text-flipkartBlue'} mr-4`} />
            <span className={`text-[14px] ${active ? 'font-bold text-flipkartBlue' : 'text-[#878787] font-medium group-hover:text-flipkartBlue'}`}>{title}</span>
            <ChevronRight size={14} className="ml-auto text-[#d5d5d5]" />
        </Link>
    );

    return (
        <div className="fk-container mt-4 mb-10 min-h-screen">
            <div className="flex flex-col md:flex-row gap-4">
                
                {/* --- SIDEBAR --- */}
                <div className="w-full md:w-[280px] shrink-0 space-y-4">
                    {/* User Intro Card */}
                    <div className="bg-white p-3 flex items-center gap-4 shadow-sm border border-[#f0f0f0]">
                        <div className="w-12 h-12 rounded-full bg-[#f0f0f0] flex items-center justify-center">
                            <User size={24} className="text-flipkartBlue" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-[#212121]">Hello,</p>
                            <p className="text-[16px] font-bold text-[#212121] truncate capitalize">{user.firstName || 'Flipkart User'}</p>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <div className="bg-white shadow-sm border border-[#f0f0f0] overflow-hidden">
                        <Link to="/orders" className="flex items-center px-6 py-4 border-b border-[#f0f0f0] hover:bg-[#f5faff] group">
                            <ClipboardList size={20} className="text-flipkartBlue mr-4" />
                            <span className="text-[14px] font-bold text-[#878787] uppercase group-hover:text-flipkartBlue">My Orders</span>
                            <ChevronRight size={14} className="ml-auto text-[#d5d5d5]" />
                        </Link>
                        
                        <div className="py-2">
                            <div className="px-6 pb-2 text-[12px] font-bold text-[#878787] uppercase flex items-center gap-4 mt-2">
                                <User size={18} className="text-flipkartBlue" /> Account Settings
                            </div>
                            <SidebarItem icon={() => <div className="w-4" />} title="Profile Information" active={true} to="/account/profile" />
                            <SidebarItem icon={() => <div className="w-4" />} title="Manage Addresses" to="/account/profile" />
                        </div>

                        <div className="py-2 border-t">
                            <div className="px-6 pb-2 text-[12px] font-bold text-[#878787] uppercase flex items-center gap-4 mt-2">
                                <Heart size={18} className="text-flipkartBlue" /> My Stuff
                            </div>
                            <SidebarItem icon={() => <div className="w-4" />} title="Wishlist" to="/wishlist" />
                        </div>

                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center px-6 py-4 border-t border-[#f0f0f0] hover:bg-[#fff5f5] text-[#212121] font-bold group"
                        >
                            <Power size={18} className="text-flipkartBlue mr-4 group-hover:text-red-500" />
                            <span className="text-[14px] group-hover:text-red-500">Logout</span>
                        </button>
                    </div>
                </div>

                {/* --- MAIN CONTENT --- */}
                <div className="flex-1 bg-white shadow-sm border border-[#f0f0f0] p-6 sm:p-10">
                    
                    {msg.text && (
                        <div className={`mb-6 p-3 flex items-center gap-2 rounded-sm text-[14px] font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            <CheckCircle size={16} /> {msg.text}
                        </div>
                    )}

                    {/* Section 1: Personal Info */}
                    <div className="mb-12">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-[18px] font-bold text-[#212121]">Personal Information</h2>
                            {!editMode && (
                                <button 
                                    onClick={() => { setEditMode(true); setFormData({ ...user }); }}
                                    className="text-[14px] font-bold text-flipkartBlue hover:underline cursor-pointer"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        <div className="max-w-[500px] space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[12px] text-[#878787] font-medium">First Name</label>
                                    <input 
                                        disabled={!editMode}
                                        value={editMode ? formData.firstName : user.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className={`w-full p-3 border rounded-sm outline-none transition-all ${editMode ? 'border-flipkartBlue bg-white shadow-inner' : 'border-transparent bg-[#fafafa]'}`}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[12px] text-[#878787] font-medium">Last Name</label>
                                    <input 
                                        disabled={!editMode}
                                        value={editMode ? formData.lastName : user.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className={`w-full p-3 border rounded-sm outline-none transition-all ${editMode ? 'border-flipkartBlue bg-white shadow-inner' : 'border-transparent bg-[#fafafa]'}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[12px] text-[#878787] font-medium">Email Address</label>
                                <input 
                                    disabled={true}
                                    value={user.email}
                                    className="w-full p-3 border border-transparent bg-[#fafafa] rounded-sm text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-[11px] text-[#878787] mt-1 italic">Email cannot be changed.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[12px] text-[#878787] font-medium">Mobile Number</label>
                                <input 
                                    disabled={!editMode}
                                    value={editMode ? formData.phoneNumber : user.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className={`w-full p-3 border rounded-sm outline-none transition-all ${editMode ? 'border-flipkartBlue bg-white shadow-inner' : 'border-transparent bg-[#fafafa]'}`}
                                />
                            </div>

                            {editMode && (
                                <div className="flex gap-4 pt-2">
                                    <button 
                                        onClick={handleProfileUpdate}
                                        disabled={loading}
                                        className="px-10 py-3 bg-flipkartBlue text-white font-bold rounded-sm text-[14px] shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
                                    >
                                        SAVE CHANGES
                                    </button>
                                    <button 
                                        onClick={() => setEditMode(false)}
                                        className="px-10 py-3 text-gray-500 font-bold text-[14px] hover:bg-gray-50 rounded-sm cursor-pointer"
                                    >
                                        CANCEL
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Manage Addresses */}
                    <div className="border-t pt-10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[18px] font-bold text-[#212121]">Manage Addresses</h2>
                            {!showAddressForm && (
                                <button 
                                    onClick={() => setShowAddressForm(true)}
                                    className="px-4 py-2 border border-[#e0e0e0] text-flipkartBlue font-bold text-[13px] flex items-center gap-2 hover:bg-blue-50 transition-colors uppercase cursor-pointer"
                                >
                                    <Plus size={16} /> Add Address
                                </button>
                            )}
                        </div>

                        {/* Address Form Card */}
                        {showAddressForm && (
                            <div className="bg-[#f5faff] p-6 border border-flipkartBlue/20 rounded-sm mb-8">
                                <h3 className="text-flipkartBlue font-bold text-[13px] uppercase mb-4">Add New Address</h3>
                                <form onSubmit={handleAddAddress} className="space-y-4 max-w-[600px]">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input required placeholder="Name" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} className="p-3 border rounded-sm outline-none text-[14px]" />
                                        <input required placeholder="Phone" value={newAddress.phoneNumber} onChange={e => setNewAddress({...newAddress, phoneNumber: e.target.value})} className="p-3 border rounded-sm outline-none text-[14px]" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input required placeholder="Pincode" value={newAddress.pincode} onChange={e => handlePincodeChange(e.target.value)} maxLength={6} className="p-3 border rounded-sm outline-none text-[14px]" />
                                        <input required placeholder="City/District" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="p-3 border rounded-sm outline-none text-[14px] bg-white" />
                                    </div>
                                    <input required placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full p-3 border rounded-sm outline-none text-[14px]" />
                                    <textarea required placeholder="Street Address" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} rows={3} className="w-full p-3 border rounded-sm outline-none text-[14px] resize-none" />
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="isDefault" checked={newAddress.isDefault} onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})} className="w-4 h-4" />
                                        <label htmlFor="isDefault" className="text-[14px] text-[#212121] cursor-pointer">Set as default address</label>
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <button disabled={loading} type="submit" className="px-10 py-3 bg-flipkartOrange text-white font-bold rounded-sm text-[13px] uppercase tracking-wide cursor-pointer shadow-sm">Save Address</button>
                                        <button type="button" onClick={() => setShowAddressForm(false)} className="px-10 py-3 text-gray-500 font-bold text-[13px] uppercase cursor-pointer">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Saved Addresses List */}
                        <div className="space-y-4">
                            {addresses.length === 0 ? (
                                <div className="py-10 text-center border-2 border-dashed border-[#f0f0f0] bg-[#fafafa]">
                                    <MapPin size={40} className="mx-auto text-[#d5d5d5] mb-2" />
                                    <p className="text-[14px] text-[#878787]">No saved addresses found.</p>
                                </div>
                            ) : (
                                addresses.map((addr) => (
                                    <div key={addr.id} className="p-5 border border-[#f0f0f0] hover:border-flipkartBlue/30 transition-colors flex gap-4 group">
                                        <div className="shrink-0 mt-1">
                                            <MapPin size={18} className="text-flipkartBlue" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-bold text-[14px]">{addr.name}</span>
                                                <span className="text-[12px] bg-[#f0f0f0] px-2 py-0.5 rounded-sm font-bold text-[#878787] uppercase truncate">{addr.phoneNumber}</span>
                                                {addr.isDefault && (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm font-bold uppercase">Default</span>
                                                )}
                                            </div>
                                            <p className="text-[13px] text-[#212121] leading-relaxed line-clamp-2">
                                                {addr.street}, {addr.city}, {addr.state} - <span className="font-bold">{addr.postalCode}</span>
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteAddress(addr.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
