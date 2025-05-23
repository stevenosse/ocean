import { extractErrorMessage, useApi } from './useApi'
import { useToast } from './useToast'
import type { Deployment, Environment, Project } from '~/types'

export const useProjects = () => {
    const api = useApi()
    const toast = useToast()


    const fetchProjects = async (): Promise<Project[]> => {
        try {
            const response = await api.axiosInstance.get<Project[]>(`/projects`)
            return response.data
        } catch (error: any) {
            console.error('Error fetching projects:', error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to load projects: ${errorMessage}`)
            return []
        }
    }

    const fetchProject = async (id: number): Promise<Project | null> => {
        try {
            const response = await api.axiosInstance.get<Project>(`/projects/${id}`)
            return response.data
        } catch (error: any) {
            console.error(`Error fetching project ${id}:`, error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to load project ${id}: ${errorMessage}`)
            return null
        }
    }

    const createProject = async (project: Partial<Project>): Promise<Project | null> => {
        try {
            const response = await api.axiosInstance.post<Project>(`/projects`, project)
            return response.data
        } catch (error: any) {
            console.error('Error creating project:', error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to create project: ${errorMessage}`)
            return null
        }
    }

    const updateProject = async (id: number, project: Partial<Project>): Promise<Project | null> => {
        try {
            const { id: projectId, createdAt, updatedAt, applicationUrl, ...cleanedProject } = project;

            const response = await api.axiosInstance.patch<Project>(`/projects/${id}`, cleanedProject)
            return response.data
        } catch (error: any) {
            console.error(`Error updating project ${id}:`, error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to update project ${id}: ${errorMessage}`)
            return null
        }
    }


    const fetchProjectDeployments = async (projectId: number): Promise<Deployment[]> => {
        try {
            const response = await api.axiosInstance.get<Deployment[]>(`/deployments/project/${projectId}`)
            return response.data
        } catch (error: any) {
            console.error(`Error fetching deployments for project ${projectId}:`, error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to fetch deployments for project ${projectId}: ${errorMessage}`)
            return []
        }
    }

    const triggerDeploy = async (projectId: number): Promise<Deployment | null> => {
        try {
            const response = await api.axiosInstance.post<Deployment>(`/projects/${projectId}/deploy`)
            return response.data
        } catch (error: any) {
            console.error(`Error triggering deployment for project ${projectId}:`, error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to trigger deployment for project ${projectId}: ${errorMessage}`)
            return null
        }
    }

    const fetchEnvironments = async (projectId: number): Promise<Environment[]> => {
        try {
            const response = await api.axiosInstance.get<Environment[]>(`/environments/project/${projectId}`)
            return response.data
        } catch (error: any) {
            console.error(`Error fetching environments for project ${projectId}:`, error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to fetch environments for project ${projectId}: ${errorMessage}`)
            return []
        }
    }

    const fetchEnvironment = async (id: number): Promise<Environment | null> => {
        try {
            const response = await api.axiosInstance.get<Environment>(`/environments/${id}`)
            return response.data
        } catch (error: any) {
            console.error(`Error fetching environment ${id}:`, error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to fetch environment ${id}: ${errorMessage}`)
            return null
        }
    }

    const createEnvironment = async (environment: Environment): Promise<Environment | null> => {
        try {
            const response = await api.axiosInstance.post<Environment>(`/environments`, environment)
            return response.data
        } catch (error: any) {
            console.error('Error creating environment:', error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to create environment: ${errorMessage}`)
            return null
        }
    }

    const updateEnvironment = async (id: number, environment: Partial<Environment>): Promise<Environment | null> => {
        try {
            const response = await api.axiosInstance.patch<Environment>(`/environments/${id}`, environment)
            return response.data
        } catch (error: any) {
            console.error(`Error updating environment ${id}:`, error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to update environment ${id}: ${errorMessage}`)
            return null
        }
    }

    const deleteEnvironment = async (id: number): Promise<boolean> => {
        try {
            await api.axiosInstance.delete(`/environments/${id}`)
            return true
        } catch (error: any) {
            console.error(`Error deleting environment ${id}:`, error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to delete environment ${id}: ${errorMessage}`)
            return false
        }
    }

    const fetchProjectLogs = async (projectId: number): Promise<string[]> => {
        try {
            const response = await api.axiosInstance.get<string[]>(`/projects/${projectId}/logs`)
            return response.data
        } catch (error: any) {
            console.error(`Error fetching logs for project ${projectId}:`, error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to fetch logs for project ${projectId}: ${errorMessage}`)
            return ['']
        }
    }

    const deleteProject = async (id: number): Promise<boolean> => {
        try {
            await api.axiosInstance.delete(`/projects/${id}`)
            return true
        } catch (error: any) {
            console.error(`Error deleting project ${id}:`, error)
            const errorMessage = extractErrorMessage(error)
            toast.error(`Failed to delete project ${id}: ${errorMessage}`)
            return false
        }
    }

    return {
        fetchProjects,
        fetchProject,
        createProject,
        updateProject,
        fetchProjectDeployments,
        triggerDeploy,
        fetchEnvironments,
        fetchEnvironment,
        createEnvironment,
        updateEnvironment,
        deleteEnvironment,
        fetchProjectLogs,
        deleteProject
    }
}