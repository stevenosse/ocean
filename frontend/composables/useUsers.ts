import { User } from "~/types"
import { useApi } from "./useApi"
import { useToast } from "./useToast"

export const useUsers = () => {
    const api = useApi()
    const toast = useToast()

    const fetchUsers = async () => {
        try {
          const response = await api.axiosInstance.get<User[]>(`/users`)
          return response.data
        } catch (error) {
          console.error('Error fetching users:', error)
          toast.error('Failed to load users')
          return []
        }
      }
    
      const createUser = async (userData: { email: string; password: string }) => {
        try {
          const response = await api.axiosInstance.post<User>(`/users`, userData)
          return response.data
        } catch (error) {
          console.error('Error creating user:', error)
          toast.error('Failed to create user')
          return null
        }
      }
    
      const updateUserRole = async (userId: number, role: string) => {
        try {
          const response = await api.axiosInstance.patch<User>(`/users/${userId}`, { role })
          return response.data
        } catch (error) {
          console.error(`Error updating user ${userId}:`, error)
          toast.error(`Failed to update user ${userId}`)
          return null
        }
      }
    
      const updateUser = async (user: User) => {
        try {
          const response = await api.axiosInstance.patch<User>(`/users/${user.id}`, user)
          return response.data
        } catch (error) {
          console.error(`Error updating user ${user.id}:`, error)
          toast.error(`Failed to update user ${user.id}`)
          return null
        }
      }
    
      const deleteUser = async (userId: number) => {
        try {
          const response = await api.axiosInstance.delete(`/users/${userId}`)
          return response.data
        } catch (error) {
          console.error(`Error deleting user ${userId}:`, error)
          toast.error(`Failed to delete user ${userId}`)
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