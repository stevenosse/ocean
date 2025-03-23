import { useRuntimeConfig, useCookie, useFetch } from 'nuxt/app'
import { useToast } from './useToast'
import type { ManagedDatabase, DatabaseBackup } from '~/types'

export interface CreateDatabaseDto {
  name: string
  projectId: number
}

export interface ConnectionStringResponse {
  connectionString: string
}

export const useDatabaseApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiURL
  const toast = useToast()

  const getAuthHeaders = (): HeadersInit => {
    const token = useCookie('token').value
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const getDatabases = async (projectId?: number): Promise<ManagedDatabase[]> => {
    try {
      const url = projectId ? `${baseURL}/database?projectId=${projectId}` : `${baseURL}/database`
      return await $fetch<ManagedDatabase[]>(url, {
        headers: getAuthHeaders()
      })
    } catch (error: any) {
      console.error('Error fetching databases:', error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to load databases: ${errorMessage}`)
      return []
    }
  }

  const getDatabase = async (id: number): Promise<ManagedDatabase | null> => {
    try {
      return await $fetch<ManagedDatabase>(`${baseURL}/database/${id}`, {
        headers: getAuthHeaders()
      })
    } catch (error: any) {
      console.error(`Error fetching database ${id}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to load database: ${errorMessage}`)
      return null
    }
  }

  const createDatabase = async (data: CreateDatabaseDto): Promise<ManagedDatabase | null> => {
    try {
      return await $fetch<ManagedDatabase>(`${baseURL}/database`, {
        method: 'POST',
        body: data,
        headers: getAuthHeaders()
      })
    } catch (error: any) {
      console.error('Error creating database:', error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to create database: ${errorMessage}`)
      return null
    }
  }

  const deleteDatabase = async (id: number): Promise<boolean> => {
    try {
      await $fetch(`${baseURL}/database/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
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
      return await $fetch<ConnectionStringResponse>(`${baseURL}/database/${id}/connection-string`, {
        headers: getAuthHeaders()
      })
    } catch (error: any) {
      console.error(`Error fetching connection string for database ${id}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to get connection string: ${errorMessage}`)
      return null
    }
  }

  const getBackups = async (databaseId: number): Promise<DatabaseBackup[]> => {
    try {
      return await $fetch<DatabaseBackup[]>(`${baseURL}/database/${databaseId}/backups`, {
        headers: getAuthHeaders()
      })
    } catch (error: any) {
      console.error(`Error fetching backups for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to load backups: ${errorMessage}`)
      return []
    }
  }

  const createBackup = async (databaseId: number): Promise<DatabaseBackup | null> => {
    try {
      return await $fetch<DatabaseBackup>(`${baseURL}/database/${databaseId}/backup`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
    } catch (error: any) {
      console.error(`Error creating backup for database ${databaseId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to create backup: ${errorMessage}`)
      return null
    }
  }

  const getBackup = async (backupId: number): Promise<DatabaseBackup | null> => {
    try {
      return await $fetch<DatabaseBackup>(`${baseURL}/database/backups/${backupId}`, {
        headers: getAuthHeaders()
      })
    } catch (error: any) {
      console.error(`Error fetching backup ${backupId}:`, error)
      const errorMessage = error.response?.statusText || error.message || 'Unknown error'
      toast.error(`Failed to load backup: ${errorMessage}`)
      return null
    }
  }

  const restoreBackup = async (backupId: number): Promise<boolean> => {
    try {
      await $fetch(`${baseURL}/database/backups/${backupId}/restore`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
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
      await $fetch(`${baseURL}/database/backups/${backupId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
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
