import { useCookie } from 'nuxt/app'
import { useToast } from './useToast'
import type { ManagedDatabase, DatabaseBackup } from '~/types'
import { useApi } from './useApi'

export interface CreateDatabaseDto {
  name: string
  projectId: number
}

export interface ConnectionStringResponse {
  connectionString: string
}

export const useDatabaseApi = () => {
  const api = useApi()
  const toast = useToast()

  const getDatabases = async (projectId?: number): Promise<ManagedDatabase[]> => {
    try {
      const url = projectId ? `/database?projectId=${projectId}` : `/database`
      const response = await api.axiosInstance.get<ManagedDatabase[]>(url)
      return response.data
    } catch (error: any) {
      console.error('Error fetching databases:', error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to load databases: ${errorMessage}`)
      return []
    }
  }

  const getDatabase = async (id: number): Promise<ManagedDatabase | null> => {
    try {
      const response = await api.axiosInstance.get<ManagedDatabase>(`/database/${id}`)
      return response.data
    } catch (error: any) {
      console.error(`Error fetching database ${id}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to load database: ${errorMessage}`)
      return null
    }
  }

  const createDatabase = async (data: CreateDatabaseDto): Promise<ManagedDatabase | null> => {
    try {
      const response = await api.axiosInstance.post<ManagedDatabase>(`/database`, data)
      return response.data
    } catch (error: any) {
      console.error('Error creating database:', error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to create database: ${errorMessage}`)
      return null
    }
  }

  const deleteDatabase = async (id: number): Promise<boolean> => {
    try {
      await api.axiosInstance.delete(`/database/${id}`)
      return true
    } catch (error: any) {
      console.error(`Error deleting database ${id}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to delete database: ${errorMessage}`)
      return false
    }
  }

  const getDatabaseConnectionString = async (id: number): Promise<ConnectionStringResponse | null> => {
    try {
      const response = await api.axiosInstance.get<ConnectionStringResponse>(`/database/${id}/connection-string`)
      return response.data
    } catch (error: any) {
      console.error(`Error fetching connection string for database ${id}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to get connection string: ${errorMessage}`)
      return null
    }
  }

  const getBackups = async (databaseId: number): Promise<DatabaseBackup[]> => {
    try {
      const response = await api.axiosInstance.get<DatabaseBackup[]>(`/database/${databaseId}/backups`)
      return response.data
    } catch (error: any) {
      console.error(`Error fetching backups for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to load backups: ${errorMessage}`)
      return []
    }
  }

  const createBackup = async (databaseId: number): Promise<DatabaseBackup | null> => {
    try {
      const response = await api.axiosInstance.post<DatabaseBackup>(`/database/${databaseId}/backup`)
      return response.data
    } catch (error: any) {
      console.error(`Error creating backup for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to create backup: ${errorMessage}`)
      return null
    }
  }

  const getBackup = async (backupId: number): Promise<DatabaseBackup | null> => {
    try {
      const response = await api.axiosInstance.get<DatabaseBackup>(`/database/backups/${backupId}`)
      return response.data
    } catch (error: any) {
      console.error(`Error fetching backup ${backupId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to load backup: ${errorMessage}`)
      return null
    }
  }

  const restoreBackup = async (backupId: number): Promise<boolean> => {
    try {
      await api.axiosInstance.post(`/database/backups/${backupId}/restore`)
      return true
    } catch (error: any) {
      console.error(`Error restoring backup ${backupId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to restore backup: ${errorMessage}`)
      return false
    }
  }

  const deleteBackup = async (backupId: number): Promise<boolean> => {
    try {
      await api.axiosInstance.delete(`/database/backups/${backupId}`)
      return true
    } catch (error: any) {
      console.error(`Error deleting backup ${backupId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to delete backup: ${errorMessage}`)
      return false
    }
  }

  return {
    getDatabases,
    getDatabase,
    createDatabase,
    deleteDatabase,
    getDatabaseConnectionString,
    getBackups,
    createBackup,
    getBackup,
    restoreBackup,
    deleteBackup
  }
}
