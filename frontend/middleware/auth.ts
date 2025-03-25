import { navigateTo } from 'nuxt/app'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/auth')) {
    return
  }

  const { initAuth, isAuthenticated } = useAuth()

  if (!isAuthenticated.value) {
    return navigateTo('/auth/login')
  }

  try {
    await initAuth()
  } catch (error) {
    return navigateTo('/auth/login')
  }
})