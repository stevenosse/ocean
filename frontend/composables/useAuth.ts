import { useRuntimeConfig, useCookie, navigateTo } from 'nuxt/app'
import { ref, computed } from 'vue'
import { AuthResponse, User } from '~/types/user'

export const useAuth = () => {
  const error = ref('')
  const isLoading = ref(false)
  const user = ref<User | null>(null)
  const apiURL = useRuntimeConfig().public.apiURL
  const isAuthenticated = computed(() => !!user.value)
  const tokenCookie = useCookie('token', { secure: true, sameSite: 'strict' })
  const userCookie = useCookie('user', { secure: true, sameSite: 'strict' })

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
      const response = await $fetch<AuthResponse>(`${apiURL}/auth/login`, {
        method: 'POST',
        body: { email, password }
      })

      tokenCookie.value = response.access_token
      userCookie.value = JSON.stringify(response.user)

      user.value = response.user

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
      const config = useRuntimeConfig()
      const baseURL = config.public.apiURL

      const response = await $fetch<AuthResponse>(`${baseURL}/auth/register`, {
        method: 'POST',
        body: { email, password }
      })

      tokenCookie.value = response.access_token
      userCookie.value = JSON.stringify(response.user)

      user.value = response.user

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

    return navigateTo('/auth/login')
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    error.value = '';
    isLoading.value = true;

    try {
      const config = useRuntimeConfig();
      const baseURL = config.public.apiURL;

      const response = await $fetch(`${baseURL}/auth/change-password`, {
        method: 'POST',
        body: { currentPassword, newPassword },
        headers: {
          Authorization: `Bearer ${tokenCookie.value}`,
        }
      });

      if (response.user) {
        user.value = response.user;
        userCookie.value = JSON.stringify(response.user);
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