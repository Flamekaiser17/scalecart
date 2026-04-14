import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api';
import { useCart } from '../context/CartContext';

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { onLogin } = useCart(); // use context's login handler

  const [form, setForm] = useState({
    email: '', password: '', username: '', firstName: '', lastName: '', phoneNumber: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const res = await loginUser(form.email, form.password);
        // Store user info for display in Navbar
        const userData = res.data?.user || res.user || { email: form.email };
        localStorage.setItem('user', JSON.stringify(userData));
        onLogin(); // Tells CartContext: user is now logged in → fetch cart
        if (onClose) onClose();
      } else {
        await registerUser({
          username:    form.username,
          email:       form.email,
          password:    form.password,
          firstName:   form.firstName  || form.username,
          lastName:    form.lastName   || '',
          phoneNumber: form.phoneNumber || '',
        });
        // Show success and auto-switch to Login tab
        setError('✅ Account created! Please login now.');
        setIsLogin(true);
        setForm(prev => ({ ...prev, password: '' })); // clear password for security
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md shadow-2xl flex overflow-hidden rounded-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Blue Panel */}
        <div className="w-2/5 bg-flipkartBlue p-6 flex flex-col justify-between hidden sm:flex">
          <div>
            <h2 className="text-white text-xl font-light leading-snug">
              {isLogin ? 'Login' : "Looks like you're new here!"}
            </h2>
            <p className="text-blue-100 text-xs mt-3 leading-relaxed">
              {isLogin
                ? 'Get access to your Orders, Wishlist and Recommendations'
                : 'Sign up with your email to get started'}
            </p>
          </div>
          <img
            src="https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/_next/static/media/loginImage.c0ed7e0e.png"
            alt="login"
            className="w-full opacity-70 mt-4"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-6 flex flex-col">
          <h3 className="text-lg font-medium mb-4 sm:hidden">{isLogin ? 'Login' : 'Create Account'}</h3>

          {error && (
            <div className={`text-xs mb-3 p-2.5 rounded ${error.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {!isLogin && (
              <>
                <input required name="username" onChange={handleChange} placeholder="Username" className="border-b py-2 outline-none text-sm focus:border-flipkartBlue" />
                <div className="grid grid-cols-2 gap-3">
                  <input required name="firstName" onChange={handleChange} placeholder="First Name" className="border-b py-2 outline-none text-sm focus:border-flipkartBlue" />
                  <input name="lastName" onChange={handleChange} placeholder="Last Name" className="border-b py-2 outline-none text-sm focus:border-flipkartBlue" />
                </div>
                <input name="phoneNumber" onChange={handleChange} placeholder="Phone (Optional)" className="border-b py-2 outline-none text-sm focus:border-flipkartBlue" />
              </>
            )}
            <input required name="email" type="email" onChange={handleChange} placeholder="Enter Email" className="border-b py-2 outline-none text-sm focus:border-flipkartBlue" />
            <input required name="password" type="password" onChange={handleChange} placeholder="Enter Password" className="border-b py-2 outline-none text-sm focus:border-flipkartBlue" />

            <p className="text-xs text-gray-400 leading-relaxed">
              By continuing, you agree to Flipkart's Terms of Use and Privacy Policy.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 bg-flipkartOrange text-white py-3 font-medium text-sm uppercase tracking-wide shadow disabled:opacity-60"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
            </button>
          </form>

          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="mt-5 text-flipkartBlue text-sm font-medium text-center w-full hover:underline"
          >
            {isLogin ? 'New to Flipkart? Create an account' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
