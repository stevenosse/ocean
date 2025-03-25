import { User } from "~/types"
import { extractErrorMessage, useApi } from "./useApi"
import { useToast } from "./useToast"

export const useUsers = () => {
    const api = useApi()
    const toast = useToast()

    const fetchUsers = async () => {
        try {
          const response = await api.axiosInstance.get<User[]>(`/users`)
          return response.data
        } catch (error: any) {
          console.error('Error fetching users:', error)
          const errorMessage = extractErrorMessage(error)
          toast.error(`Failed to load users: ${errorMessage}`)
          return []
        }
      }
    
      const createUser = async (userData: { email: string; password: string }) => {
        try {
          const response = await api.axiosInstance.post<User>(`/users`, userData)
          return response.data
        } catch (error: any) {
          console.error('Error creating user:', error)
          const errorMessage = extractErrorMessage(error)
          toast.error(`Failed to create user: ${errorMessage}`)
          return null
        }
      }
    
      const updateUserRole = async (userId: number, role: string) => {
        try {
          const response = await api.axiosInstance.patch<User>(`/users/${userId}`, { role })
          return response.data
        } catch (error: any) {
          console.error(`Error updating user ${userId}:`, error)
          const errorMessage = extractErrorMessage(error)
          toast.error(`Failed to update user ${userId}: ${errorMessage}`)
          return null
        }
      }
    
      const updateUser = async (user: User) => {
        try {
          const response = await api.axiosInstance.patch<User>(`/users/${user.id}`, user)
          return response.data
        } catch (error: any) {
          console.error(`Error updating user ${user.id}:`, error)
          const errorMessage = extractErrorMessage(error)
          toast.error(`Failed to update user ${user.id}: ${errorMessage}`)
          return null
        }
      }
    
      const deleteUser = async (userId: number) => {
        try {
          const response = await api.axiosInstance.delete(`/users/${userId}`)
          return response.data
        } catch (error: any) {
          console.error(`Error deleting user ${userId}:`, error)
          const errorMessage = extractErrorMessage(error)
          toast.error(`Failed to delete user ${userId}: ${errorMessage}`)
          return false
        }
      }

      return {
        fetchUsers,
        createUser,
        updateUserRole,
        updateUser,
        deleteUser
      }
    }