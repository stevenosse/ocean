import { defineNuxtPlugin } from '#app'
import { AuthResponse, User } from '~/types/user'

export const useAuth = () => {
  const error = ref('')
  const isLoading = ref(false)
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  // Load user from localStorage on client side
  onMounted(() => {
    if (process.client) {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser)
        } catch (e) {
          console.error('Failed to parse stored user:', e)
          localStorage.removeItem('user')
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
      
      // Store token and user in localStorage
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Update user state
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
      
      // Store token and user in localStorage
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Update user state
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
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Reset user state
    user.value = null
    
    // Redirect to login page
    return navigateTo('/auth/login')
  }

  const checkAuth = () => {
    if (process.server) return true
    
    const token = localStorage.getItem('token')
    if (!token) return false
    
    try {
      // Simple JWT expiration check
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiry = payload.exp * 1000 // Convert to milliseconds
      
      if (Date.now() >= expiry) {
        // Token expired, clear storage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        user.value = null
        return false
      }
      
      return true
    } catch (error) {
      console.error('Invalid token format:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
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
  
  // Initialize auth state
  if (process.client) {
    // Check if token is valid
    const isValid = checkAuth()
    
    // If token is invalid and not on auth page, redirect to login
    if (!isValid && !window.location.pathname.startsWith('/auth/')) {
      navigateTo('/auth/login')
    }
    
    // Load user data from localStorage if available
    const storedUser = localStorage.getItem('user')
    if (storedUser && !user.value) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Failed to parse stored user:', e)
        localStorage.removeItem('user')
      }
    }
  }
  
  // Make useAuth available throughout the app
  return {
    provide: {
      auth: useAuth()
    }
  }
})