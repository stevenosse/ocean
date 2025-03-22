import { ref, computed } from 'vue'
import { AuthResponse, User } from '~/types/user'

export const useAuth = () => {
  const error = ref('')
  const isLoading = ref(false)
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  // Use Nuxt's useCookie to manage user data
  const tokenCookie = useCookie('token', { secure: true, sameSite: 'strict' })
  const userCookie = useCookie('user', { secure: true, sameSite: 'strict' })
  
  // Initialize user from cookie if available
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
      
      // Store token and user in cookies using Nuxt's useCookie
      tokenCookie.value = response.access_token
      userCookie.value = response.user
      
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
      
      // Store token and user in cookies using Nuxt's useCookie
      tokenCookie.value = response.access_token
      userCookie.value = response.user
      
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
    // Clear cookies using Nuxt's useCookie
    tokenCookie.value = null
    userCookie.value = null
    
    // Reset user state
    user.value = null
    
    // Redirect to login page
    return navigateTo('/auth/login')
  }

  return {
    user,
    error,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout
  }
}