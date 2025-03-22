// No need to import anything for useCookie in Nuxt 3

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware if on server side
  if (process.server) return;
  
  // Skip middleware if route is an auth page
  if (to.path.startsWith('/auth/')) return;
  
  // Check if user is authenticated using Nuxt's useCookie
  const token = useCookie('token').value;
  
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
      // Token expired, clear cookies and redirect to login
      useCookie('token').value = null;
      useCookie('user').value = null;
      return navigateTo('/auth/login');
    }
    
    return true;
  } catch (error) {
    // Invalid token format, clear cookies and redirect to login
    useCookie('token').value = null;
    useCookie('user').value = null;
    return navigateTo('/auth/login');
  }
});