import { useRuntimeConfig, useCookie } from 'nuxt/app'
import { useToast } from './useToast'

export interface TunnelConnectionStringResponse {
  tunnelConnectionString: string | null
}

export interface TunnelStatusResponse {
  isActive: boolean
}

export const useDatabaseTunnelingApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiURL
  const toast = useToast()

  const getAuthHeaders = (): HeadersInit => {
    const token = useCookie('token').value
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
  
  /**
   * Gets the connection string for a database
   * This will automatically create a tunnel if needed
   * @param databaseId The database ID
   * @returns The connection string
   */
  const getConnectionString = async (databaseId: number): Promise<string | null> => {
    try {
      const response = await $fetch<{ connectionString: string }>(
        `${baseURL}/database/${databaseId}/connection-string`,
        { headers: getAuthHeaders() }
      )
      
      return response.connectionString
    } catch (error: any) {
      console.error(`Error getting connection string for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to get database connection string: ${errorMessage}`)
      return null
    }
  }

  const createTunnel = async (databaseId: number, localPort?: number): Promise<string | null> => {
    try {
      const url = localPort
        ? `${baseURL}/database/${databaseId}/tunnel?localPort=${localPort}`
        : `${baseURL}/database/${databaseId}/tunnel`
      
      const response = await $fetch<TunnelConnectionStringResponse>(url, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      
      return response.tunnelConnectionString
    } catch (error: any) {
      console.error(`Error creating tunnel for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to create database tunnel: ${errorMessage}`)
      return null
    }
  }

  const stopTunnel = async (databaseId: number): Promise<boolean> => {
    try {
      await $fetch(`${baseURL}/database/${databaseId}/tunnel`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      return true
    } catch (error: any) {
      console.error(`Error stopping tunnel for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to stop database tunnel: ${errorMessage}`)
      return false
    }
  }

  const getTunnelConnectionString = async (databaseId: number): Promise<string | null> => {
    try {
      const response = await $fetch<TunnelConnectionStringResponse>(`${baseURL}/database/${databaseId}/tunnel`, {
        headers: getAuthHeaders()
      })
      return response.tunnelConnectionString
    } catch (error: any) {
      console.error(`Error fetching tunnel connection string for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to get tunnel connection string: ${errorMessage}`)
      return null
    }
  }

  const isTunnelActive = async (databaseId: number): Promise<boolean> => {
    try {
      const response = await $fetch<TunnelStatusResponse>(`${baseURL}/database/${databaseId}/tunnel/status`, {
        headers: getAuthHeaders()
      })
      return response.isActive
    } catch (error: any) {
      console.error(`Error checking tunnel status for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to check tunnel status: ${errorMessage}`)
      return false
    }
  }

  const restartTunnel = async (databaseId: number, localPort?: number): Promise<string | null> => {
    try {
      const url = localPort
        ? `${baseURL}/database/${databaseId}/tunnel/restart?localPort=${localPort}`
        : `${baseURL}/database/${databaseId}/tunnel/restart`
      
      const response = await $fetch<TunnelConnectionStringResponse>(url, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      
      return response.tunnelConnectionString
    } catch (error: any) {
      console.error(`Error restarting tunnel for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to restart database tunnel: ${errorMessage}`)
      return null
    }
  }

  return {
    getConnectionString,
    createTunnel,
    stopTunnel,
    getTunnelConnectionString,
    isTunnelActive,
    restartTunnel
  }
}