import { useRuntimeConfig } from 'nuxt/app'
import type { Project, Deployment } from '~/types'

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiURL

  const fetchProjects = async (): Promise<Project[]> => {
    try {
      return await $fetch<Project[]>(`${baseURL}/projects`)
    } catch (error) {
      console.error('Error fetching projects:', error)
      return []
    }
  }

  const fetchProject = async (id: number): Promise<Project | null> => {
    try {
      return await $fetch<Project>(`${baseURL}/projects/${id}`)
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error)
      return null
    }
  }

  const createProject = async (project: Partial<Project>): Promise<Project | null> => {
    try {
      return await $fetch<Project>(`${baseURL}/projects`, {
        method: 'POST',
        body: project
      })
    } catch (error) {
      console.error('Error creating project:', error)
      return null
    }
  }

  const updateProject = async (id: number, project: Partial<Project>): Promise<Project | null> => {
    try {
      return await $fetch<Project>(`${baseURL}/projects/${id}`, {
        method: 'PUT',
        body: project
      })
    } catch (error) {
      console.error(`Error updating project ${id}:`, error)
      return null
    }
  }

  const fetchDeployments = async (): Promise<Deployment[]> => {
    try {
      return await $fetch<Deployment[]>(`${baseURL}/deployments`)
    } catch (error) {
      console.error('Error fetching deployments:', error)
      return []
    }
  }

  const fetchDeployment = async (id: number): Promise<Deployment | null> => {
    try {
      return await $fetch<Deployment>(`${baseURL}/deployments/${id}`)
    } catch (error) {
      console.error(`Error fetching deployment ${id}:`, error)
      return null
    }
  }

  const fetchProjectDeployments = async (projectId: number): Promise<Deployment[]> => {
    try {
      return await $fetch<Deployment[]>(`${baseURL}/deployments/project/${projectId}`)
    } catch (error) {
      console.error(`Error fetching deployments for project ${projectId}:`, error)
      return []
    }
  }

  const triggerDeploy = async (projectId: number): Promise<Deployment | null> => {
    try {
      return await $fetch<Deployment>(`${baseURL}/projects/${projectId}/deploy`, {
        method: 'POST'
      })
    } catch (error) {
      console.error(`Error triggering deployment for project ${projectId}:`, error)
      return null
    }
  }

  return {
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    fetchDeployments,
    fetchDeployment,
    fetchProjectDeployments,
    triggerDeploy
  }
}