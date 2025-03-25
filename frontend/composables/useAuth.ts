import { useCookie, navigateTo } from 'nuxt/app'
import { ref } from 'vue'
import { AuthResponse, User } from '~/types/user'
import { useApi } from './useApi'

export const useAuth = () => {
  const error = ref('')
  const isLoading = ref(false)
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const tokenCookie = useCookie('access_token', { secure: true, sameSite: 'strict', maxAge: 60 * 60 * 24 })
  const userCookie = useCookie('user', { secure: true, sameSite: 'strict', maxAge: 60 * 60 * 24 })
  const api = useApi()

  const initAuth = () => {
    if (tokenCookie.value && userCookie.value) {
      isAuthenticated.value = true
    }

    if (userCookie.value) {
      try {
        user.value = typeof userCookie.value === 'string'
          ? JSON.parse(userCookie.value)
          : userCookie.value
        isAuthenticated.value = true
      } catch (e) {
        console.error('Failed to parse stored user:', e)
        userCookie.value = null
      }
    }
  }

  const login = async (email: string, password: string) => {
    error.value = ''
    isLoading.value = true

    try {
      const response = await api.axiosInstance.post<AuthResponse>('/auth/login', {
        email,
        password
      })

      tokenCookie.value = response.data.access_token
      userCookie.value = JSON.stringify(response.data.user)

      user.value = response.data.user
      isAuthenticated.value = true
      return user;
    } catch (e: any) {
      console.error('Login error:', e)
      error.value = e.data?.message || 'Failed to login. Please check your credentials.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const register = async (email: string, password: string): Promise<User | null> => {
    error.value = ''
    isLoading.value = true

    try {
      const response = await api.axiosInstance.post<AuthResponse>('/auth/register', {
        email,
        password
      })

      tokenCookie.value = response.data.access_token
      userCookie.value = JSON.stringify(response.data.user)

      user.value = response.data.user
      isAuthenticated.value = true
      return user.value
    } catch (e: any) {
      console.error('Registration error:', e)
      error.value = e.data?.message || 'Failed to register. Please try again.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    tokenCookie.value = null
    userCookie.value = null

    user.value = null
    isAuthenticated.value = false

    return navigateTo('/auth/login')
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    error.value = '';
    isLoading.value = true;

    try {
      const response = await api.axiosInstance.post<AuthResponse>('/auth/change-password', {
        currentPassword,
        newPassword
      })

      if (response.data.user) {
        user.value = response.data.user;
        userCookie.value = JSON.stringify(response.data.user);
      }

      return true;
    } catch (e: any) {
      console.error('Password change error:', e);
      error.value = e.data?.message || 'Failed to change password. Please try again.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    initAuth,
    user,
    error,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    changePassword
  }
}