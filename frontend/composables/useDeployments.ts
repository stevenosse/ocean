import type { Deployment } from '~/types'
import { extractErrorMessage, useApi } from './useApi'
import { useToast } from './useToast'

export const useDeployments = () => {
    const api = useApi()
    const toast = useToast()
    const fetchDeployments = async (): Promise<Deployment[]> => {
        try {
            const response = await api.axiosInstance.get<Deployment[]>(`/deployments`)
            return response.data
        } catch (error) {
            console.error('Error fetching deployments:', error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to fetch deployments: ${errorMessage}`)
            return []
        }
    }

    const fetchDeployment = async (id: number): Promise<Deployment | null> => {
        try {
            const response = await api.axiosInstance.get<Deployment>(`/deployments/${id}`)
            return response.data
        } catch (error) {
            console.error(`Error fetching deployment ${id}:`, error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to fetch deployment ${id}: ${errorMessage}`)
            return null
        }
    }

    return {
        fetchDeployments,
        fetchDeployment
    }
}