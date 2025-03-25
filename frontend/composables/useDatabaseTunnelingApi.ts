import { useCookie } from 'nuxt/app'
import { useToast } from './useToast'
import { useApi } from './useApi'

export interface TunnelConnectionStringResponse {
  tunnelConnectionString: string | null
}

export interface TunnelStatusResponse {
  isActive: boolean
}

export const useDatabaseTunnelingApi = () => {
  const api = useApi()
  const toast = useToast()

  /**
   * Gets the connection string for a database
   * This will automatically create a tunnel if needed
   * @param databaseId The database ID
   * @returns The connection string
   */
  const getConnectionString = async (databaseId: number): Promise<string | null> => {
    try {
      const response = await api.axiosInstance.get<TunnelConnectionStringResponse>(
        `/database/${databaseId}/connection-string`,
      )

      return response.data.tunnelConnectionString
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
        ? `/database/${databaseId}/tunnel?localPort=${localPort}`
        : `/database/${databaseId}/tunnel`

      const response = await api.axiosInstance.post<TunnelConnectionStringResponse>(url)

      return response.data.tunnelConnectionString
    } catch (error: any) {
      console.error(`Error creating tunnel for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to create database tunnel: ${errorMessage}`)
      return null
    }
  }

  const stopTunnel = async (databaseId: number): Promise<boolean> => {
    try {
      await api.axiosInstance.delete(`/database/${databaseId}/tunnel`)
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
      const response = await api.axiosInstance.get<TunnelConnectionStringResponse>(`/database/${databaseId}/tunnel`)
      return response.data.tunnelConnectionString
    } catch (error: any) {
      console.error(`Error fetching tunnel connection string for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to get tunnel connection string: ${errorMessage}`)
      return null
    }
  }

  const isTunnelActive = async (databaseId: number): Promise<boolean> => {
    try {
      const response = await api.axiosInstance.get<TunnelStatusResponse>(`/database/${databaseId}/tunnel/status`)
      return response.data.isActive
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
        ? `/database/${databaseId}/tunnel/restart?localPort=${localPort}`
        : `/database/${databaseId}/tunnel/restart`

      const response = await api.axiosInstance.post<TunnelConnectionStringResponse>(url)

      return response.data.tunnelConnectionString
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