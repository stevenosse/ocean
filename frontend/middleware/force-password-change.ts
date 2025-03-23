import { useAuth } from "~/composables/useAuth";

export default defineNuxtRouteMiddleware((to, from) => {
  if (to.path === '/auth/change-password') {
    return;
  }

  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated.value && user.value?.forcePasswordChange) {
    return navigateTo('/auth/change-password');
  }
});