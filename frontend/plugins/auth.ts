import { defineNuxtPlugin } from 'nuxt/app'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtPlugin((nuxtApp) => {
  const auth = useAuth()
  
  if (process.client) {
    auth.initAuth()
  }

  return {
    provide: {
      auth
    }
  }
})