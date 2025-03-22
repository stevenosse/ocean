import { ref, computed, onMounted } from 'vue'
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