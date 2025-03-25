import { ref } from 'vue'
import { useApi } from './useApi'

export interface GitHubInstallationUrlResponse {
  url: string
}

export interface GitHubAppStatus {
  installed: boolean
  installationId?: number
}

export const useGithub = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const api = useApi()
  
  const extractOwnerAndRepo = (repositoryUrl: string): { owner: string; repo: string } | null => {
    const match = repositoryUrl.match(/github\.com[\/:]([\w-]+)\/([\w-]+)(?:\.git)?$/);
    if (!match) {
      return null;
    }
    return { owner: match[1], repo: match[2] };
  }

  const getInstallationUrl = async (): Promise<string> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.axiosInstance.get<GitHubInstallationUrlResponse>('/github/installation-url')
      return response.data.url
    } catch (err) {
      console.error('Error fetching GitHub App installation URL:', err)
      error.value = 'Failed to fetch GitHub App installation URL'
      return ''
    } finally {
      loading.value = false
    }
  }

  const checkGitHubAppInstallation = async (owner: string, repo: string): Promise<GitHubAppStatus> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.axiosInstance.get<GitHubAppStatus>(`/github/installation-status?owner=${owner}&repo=${repo}`)
      return response.data
    } catch (err) {
      console.error('Error checking GitHub App installation status:', err)
      error.value = 'Failed to check GitHub App installation status'
      return { installed: false }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    getInstallationUrl,
    checkGitHubAppInstallation,
    extractOwnerAndRepo
  }
}
