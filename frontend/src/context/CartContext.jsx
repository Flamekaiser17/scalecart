import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCart, addItemToCart, updateItemInCart, removeItemFromCart } from '../services/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Helper: check if user is logged in from localStorage
const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!getStoredUser());
  // showAuthModal: any component can trigger this to prompt login
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load cart from backend — only runs when user is authenticated
  const loadCart = useCallback(async () => {
    const user = getStoredUser();
    if (!user) {
      // User not logged in — clear cart silently, no API call needed
      setCartItems([]);
      return;
    }
    try {
      setCartLoading(true);
      const response = await fetchCart();
      // Backend sends cart object directly: { items: [...populated...] }
      const cartData = response.data || response;

      if (cartData && cartData.items) {
        const formattedItems = cartData.items.map(item => ({
          productId: item.productId?._id || item.productId,
          name: item.productId?.name || 'Unknown Item',
          image: item.productId?.images?.[0] || 'https://via.placeholder.com/150',
          price: item.price,
          quantity: item.quantity,
        }));
        setCartItems(formattedItems);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      // 401 = session expired → clear user data and reset
      if (err.response?.status === 401) {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
      }
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Called after successful login (from AuthModal or Navbar)
  const onLogin = useCallback(() => {
    setIsLoggedIn(true);
    setShowAuthModal(false);
    loadCart(); // Now that user is logged in, sync cart from DB
  }, [loadCart]);

  // Called after logout
  const onLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCartItems([]);
  }, []);

  // On mount: only fetch cart if user is already logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadCart();
    }
  }, [isLoggedIn, loadCart]);

  const addToCart = async (productData) => {
    // If not logged in, show auth modal instead of failing silently
    if (!getStoredUser()) {
      setShowAuthModal(true);
      return;
    }
    try {
      // Optimistic update for instant UI feedback
      const existing = cartItems.find(item => item.productId === productData.productId);
      if (existing) {
        setCartItems(cartItems.map(item =>
          item.productId === productData.productId
            ? { ...item, quantity: item.quantity + productData.quantity }
            : item
        ));
      } else {
        setCartItems([...cartItems, productData]);
      }
      // Persist to backend
      await addItemToCart(productData.productId, productData.quantity, productData.price);
      loadCart(); // Re-sync to get accurate DB state
    } catch (err) {
      if (err.response?.status === 401) {
        setShowAuthModal(true);
      }
      console.error('Add to cart failed:', err.message);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      setCartItems(cartItems.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      ));
      await updateItemInCart(productId, newQuantity);
      loadCart();
    } catch (err) {
      console.error('Cart update failed:', err.message);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setCartItems(cartItems.filter(item => item.productId !== productId));
      await removeItemFromCart(productId);
      loadCart();
    } catch (err) {
      console.error('Cart remove failed:', err.message);
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartLoading,
      isLoggedIn,
      showAuthModal,
      setShowAuthModal,
      loadCart,
      onLogin,
      onLogout,
      addToCart,
      updateQuantity,
      removeFromCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};
