export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware if on server side
  if (process.server) return;
  
  // Skip middleware if route is an auth page
  if (to.path.startsWith('/auth/')) return;
  
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  
  // If no token is found, redirect to login
  if (!token) {
    return navigateTo('/auth/login');
  }
  
  // If token exists, verify it's not expired
  try {
    // Simple JWT expiration check
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    
    if (Date.now() >= expiry) {
      // Token expired, clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return navigateTo('/auth/login');
    }
  } catch (error) {
    // Invalid token format, clear storage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return navigateTo('/auth/login');
  }
});