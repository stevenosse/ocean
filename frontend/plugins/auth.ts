import { ref, computed, onMounted } from 'vue'
import { AuthResponse, User } from '~/types/user'

export const useAuth = () => {
  const error = ref('')
  const isLoading = ref(false)
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  
  onMounted(() => {
    if (process.client) {
      const userCookie = useCookie('user')
      if (userCookie.value) {
        try {
          user.value = typeof userCookie.value === 'string'
            ? JSON.parse(userCookie.value)
            : userCookie.value
        } catch (e) {
          console.error('Failed to parse stored user:', e)
          userCookie.value = null
        }
      }
    }
  })

  const login = async (email: string, password: string) => {
    error.value = ''
    isLoading.value = true

    try {
      const config = useRuntimeConfig()
      const baseURL = config.public.apiURL

      const response = await $fetch<AuthResponse>(`${baseURL}/auth/login`, {
        method: 'POST',
        body: { email, password }
      })

      const userCookie = useCookie('user')
      const tokenCookie = useCookie('token')
      userCookie.value = JSON.stringify(response.user)
      tokenCookie.value = response.access_token

      user.value = response.user

      return true
    } catch (e: any) {
      console.error('Login error:', e)
      error.value = e.data?.message || 'Failed to login. Please check your credentials.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const register = async (email: string, password: string) => {
    error.value = ''
    isLoading.value = true

    try {
      const config = useRuntimeConfig()
      const baseURL = config.public.apiURL

      const response = await $fetch<AuthResponse>(`${baseURL}/auth/register`, {
        method: 'POST',
        body: { email, password }
      })

      const userCookie = useCookie('user')
      const tokenCookie = useCookie('token')
      userCookie.value = JSON.stringify(response.user)
      tokenCookie.value = response.access_token

      user.value = response.user

      return true
    } catch (e: any) {
      console.error('Registration error:', e)
      error.value = e.data?.message || 'Failed to register. Please try again.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    const userCookie = useCookie('user')
    const tokenCookie = useCookie('token')
    userCookie.value = null
    tokenCookie.value = null

    user.value = null

    return navigateTo('/auth/login')
  }

  const checkAuth = () => {
    if (process.server) return true

    const tokenCookie = useCookie('token')
    if (!tokenCookie.value) return false

    try {
      const payload = JSON.parse(atob(tokenCookie.value.split('.')[1]))
      const expiry = payload.exp * 1000

      if (Date.now() >= expiry) {
        const userCookie = useCookie('user')
        const tokenCookie = useCookie('token')
        userCookie.value = null
        tokenCookie.value = null
        user.value = null
        return false
      }

      return true
    } catch (error) {
      console.error('Invalid token format:', error)
      const userCookie = useCookie('user')
      const tokenCookie = useCookie('token')
      userCookie.value = null
      tokenCookie.value = null
      user.value = null
      return false
    }
  }

  return {
    user,
    error,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth
  }
}

export default defineNuxtPlugin(() => {
  const { checkAuth, user } = useAuth()

  if (process.client) {
    const isValid = checkAuth()

    if (!isValid && !window.location.pathname.startsWith('/auth/')) {
      navigateTo('/auth/login')
    }

    const storedUser = useCookie('user')
    if (storedUser.value && !user.value) {
      try {
        user.value = JSON.parse(storedUser.value)
      } catch (e) {
        console.error('Failed to parse stored user:', e)
        const userCookie = useCookie('user')
        userCookie.value = null
      }
    }
  }

  return {
    provide: {
      auth: useAuth()
    }
  }
})