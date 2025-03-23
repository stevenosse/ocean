export default defineNuxtRouteMiddleware((to, from) => {
  if (process.server) return;
  
  if (to.path.startsWith('/auth/')) return;
  
  const token = useCookie('token').value;
  
  if (!token) {
    return navigateTo('/auth/login');
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    
    if (Date.now() >= expiry) {
      useCookie('token').value = null;
      useCookie('user').value = null;
      return navigateTo('/auth/login');
    }
    
    return true;
  } catch (error) {
    useCookie('token').value = null;
    useCookie('user').value = null;
    return navigateTo('/auth/login');
  }
});