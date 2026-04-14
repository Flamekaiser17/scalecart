import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getWishlist, toggleWishlistItem } from '../services/api';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]); // [{ productId: {...populated} }]
  const [wishlistIds, setWishlistIds] = useState(new Set()); // fast O(1) lookup

  // Load wishlist from backend (only when logged in)
  const loadWishlist = useCallback(async () => {
    if (!getStoredUser()) { setWishlistItems([]); setWishlistIds(new Set()); return; }
    try {
      const res = await getWishlist();
      // Backend: { items: [{ productId: {...populated} }] }
      const items = res.items || [];
      setWishlistItems(items);
      setWishlistIds(new Set(items.map(i => i.productId?._id || i.productId)));
    } catch (_) {
      setWishlistItems([]);
    }
  }, []);

  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  // Toggle: add if not in wishlist, remove if already in
  const toggleWishlist = async (product) => {
    if (!getStoredUser()) return; // caller should handle showing auth modal
    const productId = product._id || product.productId;

    // Optimistic UI update
    if (wishlistIds.has(productId)) {
      setWishlistIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
      setWishlistItems(prev => prev.filter(i => (i.productId?._id || i.productId) !== productId));
    } else {
      setWishlistIds(prev => new Set([...prev, productId]));
      setWishlistItems(prev => [...prev, { productId: product, _id: productId }]);
    }

    try {
      await toggleWishlistItem(productId);
    } catch (_) {
      // Revert on failure
      loadWishlist();
    }
  };

  const isWishlisted = (productId) => wishlistIds.has(productId);

  return (
    <WishlistContext.Provider value={{ wishlistItems, wishlistIds, toggleWishlist, isWishlisted, loadWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
