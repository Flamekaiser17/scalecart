import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api';
import { useCart } from '../context/CartContext';
import { X } from 'lucide-react';

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { onLogin } = useCart();

  const [form, setForm] = useState({
    email: '', password: '', username: '', firstName: '', lastName: '', phoneNumber: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (isLogin) {
        const res = await loginUser(form.email, form.password);
        const userData = res.data?.user || res.user || { email: form.email };
        localStorage.setItem('user', JSON.stringify(userData));
        onLogin();
        if (onClose) onClose();
      } else {
        await registerUser({
          username: form.username,
          email: form.email,
          password: form.password,
          firstName: form.firstName || form.username,
          lastName: form.lastName || '',
          phoneNumber: form.phoneNumber || '',
        });
        setSuccess('Account created! Please login now.');
        setIsLogin(true);
        setForm(prev => ({ ...prev, password: '' }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border-b border-[#e0e0e0] py-2.5 outline-none text-[14px] text-[#212121] focus:border-flipkartBlue transition-colors placeholder:text-[#878787] bg-transparent";

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[750px] shadow-2xl flex overflow-hidden rounded-sm relative"
        onClick={(e) => e.stopPropagation()}
        style={{ minHeight: '430px' }}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-[#878787] cursor-pointer transition-colors">
          <X size={18} />
        </button>

        {/* Left Blue Panel */}
        <div className="w-[280px] bg-flipkartBlue p-7 flex flex-col justify-between hidden sm:flex shrink-0">
          <div>
            <h2 className="text-white text-[28px] font-bold leading-tight">
              {isLogin ? 'Login' : "Looks like you're new here!"}
            </h2>
            <p className="text-blue-100 text-[14px] mt-3 leading-relaxed font-light">
              {isLogin
                ? 'Get access to your Orders, Wishlist and Recommendations.'
                : 'Sign up with your email to get started'}
            </p>
          </div>
          <img
            src="https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/_next/static/media/loginImage.c0ed7e0e.png"
            alt="login illustration"
            className="w-full opacity-80 mt-4"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 px-8 py-7 flex flex-col">
          <h3 className="text-[18px] font-medium mb-5 sm:hidden text-[#212121]">{isLogin ? 'Login' : 'Create Account'}</h3>

          {error && (
            <div className="text-[13px] mb-3 p-2.5 rounded-sm bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]">
              {error}
            </div>
          )}
          {success && (
            <div className="text-[13px] mb-3 p-2.5 rounded-sm bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
            {!isLogin && (
              <>
                <input required name="username" value={form.username} onChange={handleChange} placeholder="Username *" className={inputCls} />
                <div className="grid grid-cols-2 gap-4">
                  <input required name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name *" className={inputCls} />
                  <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" className={inputCls} />
                </div>
                <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="Phone (Optional)" className={inputCls} />
              </>
            )}
            <input required name="email" type="email" value={form.email} onChange={handleChange} placeholder="Enter Email *" className={inputCls} />
            <input required name="password" type="password" value={form.password} onChange={handleChange} placeholder="Enter Password *" className={inputCls} />

            <p className="text-[12px] text-[#878787] leading-relaxed mt-1">
              By continuing, you agree to Flipkart's <span className="text-flipkartBlue cursor-pointer">Terms of Use</span> and <span className="text-flipkartBlue cursor-pointer">Privacy Policy</span>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 bg-[#fb641b] text-white py-3.5 font-semibold text-[14px] uppercase tracking-wide shadow-sm rounded-sm disabled:opacity-50 hover:bg-[#e85d19] transition-colors cursor-pointer"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
            </button>

            {/* OR separator */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-[#e0e0e0]"></div>
              <span className="text-[12px] text-[#878787]">OR</span>
              <div className="flex-1 h-px bg-[#e0e0e0]"></div>
            </div>
          </form>

          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            className="text-flipkartBlue text-[14px] font-medium text-center w-full hover:underline cursor-pointer"
          >
            {isLogin ? 'New to Flipkart? Create an account' : 'Existing User? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
