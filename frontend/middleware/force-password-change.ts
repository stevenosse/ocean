export default defineNuxtRouteMiddleware((to, from) => {
  // Skip this middleware for the password change page itself
  if (to.path === '/auth/change-password') {
    return;
  }

  // Get the current user from the auth composable
  const { user, isAuthenticated } = useAuth();

  // If user is authenticated and needs to change password, redirect to password change page
  if (isAuthenticated.value && user.value?.forcePasswordChange) {
    return navigateTo('/auth/change-password');
  }
});