import type { Deployment } from '~/types'
import { useApi } from './useApi'

export const useDeployments = () => {
    const api = useApi()
    const fetchDeployments = async (): Promise<Deployment[]> => {
        try {
            const response = await api.axiosInstance.get<Deployment[]>(`/deployments`)
            return response.data
        } catch (error) {
            console.error('Error fetching deployments:', error)
            return []
        }
    }

    const fetchDeployment = async (id: number): Promise<Deployment | null> => {
        try {
            const response = await api.axiosInstance.get<Deployment>(`/deployments/${id}`)
            return response.data
        } catch (error) {
            console.error(`Error fetching deployment ${id}:`, error)
            return null
        }
    }

    return {
        fetchDeployments,
        fetchDeployment
    }
}