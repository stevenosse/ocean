import { useCookie, useRuntimeConfig } from 'nuxt/app'
import type { Project, Deployment, Environment } from '~/types'

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiURL

  const getAuthHeaders = (): HeadersInit => {
    const token = useCookie('token').value
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const fetchProjects = async (): Promise<Project[]> => {
    try {
      return await $fetch<Project[]>(`${baseURL}/projects`, {
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error('Error fetching projects:', error)
      return []
    }
  }

  const fetchProject = async (id: number): Promise<Project | null> => {
    try {
      return await $fetch<Project>(`${baseURL}/projects/${id}`, {
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error)
      return null
    }
  }

  const createProject = async (project: Partial<Project>): Promise<Project | null> => {
    try {
      return await $fetch<Project>(`${baseURL}/projects`, {
        method: 'POST',
        body: project,
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error('Error creating project:', error)
      return null
    }
  }

  const updateProject = async (id: number, project: Partial<Project>): Promise<Project | null> => {
    try {
      const { id: projectId, createdAt, updatedAt, applicationUrl, ...cleanedProject } = project;

      return await $fetch<Project>(`${baseURL}/projects/${id}`, {
        method: 'PATCH',
        body: cleanedProject,
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error(`Error updating project ${id}:`, error)
      return null
    }
  }

  const fetchDeployments = async (): Promise<Deployment[]> => {
    try {
      return await $fetch<Deployment[]>(`${baseURL}/deployments`, {
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error('Error fetching deployments:', error)
      return []
    }
  }

  const fetchDeployment = async (id: number): Promise<Deployment | null> => {
    try {
      return await $fetch<Deployment>(`${baseURL}/deployments/${id}`, {
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error(`Error fetching deployment ${id}:`, error)
      return null
    }
  }

  const fetchProjectDeployments = async (projectId: number): Promise<Deployment[]> => {
    try {
      return await $fetch<Deployment[]>(`${baseURL}/deployments/project/${projectId}`, {
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error(`Error fetching deployments for project ${projectId}:`, error)
      return []
    }
  }

  const triggerDeploy = async (projectId: number): Promise<Deployment | null> => {
    try {
      return await $fetch<Deployment>(`${baseURL}/projects/${projectId}/deploy`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error(`Error triggering deployment for project ${projectId}:`, error)
      return null
    }
  }

  const fetchEnvironments = async (projectId: number): Promise<Environment[]> => {
    try {
      return await $fetch<Environment[]>(`${baseURL}/environments/project/${projectId}`, {
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error(`Error fetching environments for project ${projectId}:`, error)
      return []
    }
  }

  const fetchEnvironment = async (id: number): Promise<Environment | null> => {
    try {
      return await $fetch<Environment>(`${baseURL}/environments/${id}`, {
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error(`Error fetching environment ${id}:`, error)
      return null
    }
  }

  const createEnvironment = async (environment: Environment): Promise<Environment | null> => {
    try {
      return await $fetch<Environment>(`${baseURL}/environments`, {
        method: 'POST',
        body: environment,
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error('Error creating environment:', error)
      return null
    }
  }

  const updateEnvironment = async (id: number, environment: Partial<Environment>): Promise<Environment | null> => {
    try {
      return await $fetch<Environment>(`${baseURL}/environments/${id}`, {
        method: 'PATCH',
        body: environment,
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error(`Error updating environment ${id}:`, error)
      return null
    }
  }

  const deleteEnvironment = async (id: number): Promise<boolean> => {
    try {
      await $fetch(`${baseURL}/environments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      return true
    } catch (error) {
      console.error(`Error deleting environment ${id}:`, error)
      return false
    }
  }

  const fetchProjectLogs = async (projectId: number): Promise<string[]> => {
    try {
      return await $fetch<string[]>(`${baseURL}/projects/${projectId}/logs`, {
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error(`Error fetching logs for project ${projectId}:`, error)
      return ['']
    }
  }

  const deleteProject = async (id: number): Promise<boolean> => {
    try {
      await $fetch(`${baseURL}/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      return true
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error)
      return false
    }
  }

  const fetchUsers = async () => {
    try {
      return await $fetch(`${baseURL}/users`, {
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  const createUser = async (userData: { email: string; password: string }) => {
    try {
      return await $fetch(`${baseURL}/users`, {
        method: 'POST',
        body: userData,
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  const updateUserRole = async (userId: number, role: string) => {
    try {
      return await $fetch(`${baseURL}/users/${userId}`, {
        method: 'PATCH',
        body: { role },
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error)
      throw error
    }
  }

  const updateUser = async (user: User) => {
    try {
      return await $fetch(`${baseURL}/users/${user.id}`, {
        method: 'PATCH',
        body: user,
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error(`Error updating user ${user.id}:`, error)
      throw error
    }
  }

  const deleteUser = async (userId: number) => {
    try {
      await $fetch(`${baseURL}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      return true
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error)
      throw error
    }
  }

  return {
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,

    fetchDeployments,
    fetchDeployment,
    fetchProjectDeployments,
    fetchProjectLogs,
    triggerDeploy,

    fetchEnvironments,
    fetchEnvironment,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,

    fetchUsers,
    createUser,
    updateUserRole,
    updateUser,
    deleteUser
  }
}