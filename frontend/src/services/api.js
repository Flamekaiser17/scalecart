import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true, // Needed if you use cookies for JWT
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProducts = async (params) => {
  // params should be { search, category, page, limit }
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getCategories = async () => {
  // Calls: GET /api/v1/categories/categories
  const response = await api.get('/categories/categories');
  return response.data;
};

// --- CART APIs ---
export const fetchCart = async () => {
  const response = await api.get('/cart');
  return response.data;
};

export const addItemToCart = async (productId, quantity, price) => {
  // Backend route: POST /cart/add
  const response = await api.post('/cart/add', { productId, quantity, price });
  return response.data;
};

export const updateItemInCart = async (productId, quantity) => {
  // Backend route: PUT /cart/update
  const response = await api.put('/cart/update', { productId, quantity });
  return response.data;
};

export const removeItemFromCart = async (productId) => {
  // Backend route: DELETE /cart/remove
  const response = await api.delete('/cart/remove', { data: { productId } });
  return response.data;
};

// --- ORDER APIs ---
export const checkoutOrder = async (shippingData) => {
  // Backend reads: { shippingAddress: string }
  const response = await api.post('/orders/checkout', shippingData);
  return response.data;
};

// --- AUTH APIs ---
export const loginUser = async (email, password) => {
  const response = await api.post('/users/login', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/users/register', userData);
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/users/logout');
  return response.data;
};

// --- WISHLIST APIs ---
export const getWishlist = async () => {
  const response = await api.get('/wishlist');
  return response.data;
};

export const toggleWishlistItem = async (productId) => {
  // POST /wishlist/toggle — backend adds if missing, removes if present
  const response = await api.post('/wishlist/toggle', { productId });
  return response.data;
};

export const removeFromWishlist = async (productId) => {
  const response = await api.delete('/wishlist/remove', { data: { productId } });
  return response.data;
};

// --- ORDER APIs ---
export const getUserOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export default api;
