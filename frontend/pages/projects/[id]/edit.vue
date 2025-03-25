<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Edit Project</h1>
      <NuxtLink :to="`/projects/${$route.params.id}`" class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm">
        <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Back to Project
      </NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-10">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-500">Loading project...</p>
    </div>

    <div v-else-if="!project" class="bg-white shadow-md overflow-hidden sm:rounded-lg border border-gray-100">
      <div class="px-6 py-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">Project not found</h3>
        <p class="mt-1 text-sm text-gray-500">The project you're trying to edit doesn't exist or has been removed.</p>
        <div class="mt-6">
          <NuxtLink to="/projects" class="inline-flex items-center px-5 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
            View all projects
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-else class="bg-white shadow-md overflow-hidden sm:rounded-lg border border-gray-100">
      <div class="px-6 py-6 sm:p-8">
        <form @submit.prevent="validateAndSaveProject" class="mt-8 space-y-6">
          <div class="space-y-8">
            <!-- Project Name Field -->
            <div class="relative">
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Project Name <span class="text-red-500">*</span></label>
              <div class="relative">
                <input 
                  type="text" 
                  id="name" 
                  v-model="project.name" 
                  :class="['appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm', 
                    errors.name ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300']"
                  @blur="validateField('name')"
                  placeholder="Enter project name"
                />
                <div v-if="errors.name" class="mt-2 text-sm text-red-600">
                  {{ errors.name }}
                </div>
              </div>
            </div>

            <!-- Repository URL Field -->
            <div class="relative">
              <label for="repositoryUrl" class="block text-sm font-medium text-gray-700 mb-1">Repository URL <span class="text-red-500">*</span></label>
              <div class="relative">
                <input 
                  type="text" 
                  id="repositoryUrl" 
                  v-model="project.repositoryUrl" 
                  :class="['appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm', 
                    errors.repositoryUrl ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300']"
                  @blur="validateField('repositoryUrl')"
                  placeholder="https://github.com/username/repo.git"
                />
                <div v-if="errors.repositoryUrl" class="mt-2 text-sm text-red-600">
                  {{ errors.repositoryUrl }}
                </div>
              </div>
              <p class="mt-2 text-sm text-gray-500">The Git repository URL for your project</p>
            </div>

            <!-- Branch Field -->
            <div class="relative">
              <label for="branch" class="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <div class="relative">
                <input 
                  type="text" 
                  id="branch" 
                  v-model="project.branch" 
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="main"
                />
              </div>
              <p class="mt-2 text-sm text-gray-500">The Git branch to deploy (defaults to main/master)</p>
            </div>

            <!-- Root Folder Field -->
            <div class="relative">
              <label for="rootFolder" class="block text-sm font-medium text-gray-700 mb-1">Root Folder</label>
              <div class="relative">
                <input 
                  type="text" 
                  id="rootFolder" 
                  v-model="project.rootFolder" 
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="/"
                />
              </div>
              <p class="mt-2 text-sm text-gray-500">The root folder path where the docker-compose file is located (defaults to repository root)</p>
            </div>

            <!-- Build Configuration Section -->
            <div class="pt-2 pb-1">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Build Configuration</h3>
              
              <!-- Install Command Field -->
              <div class="relative mb-6">
                <label for="installCommand" class="block text-sm font-medium text-gray-700 mb-1">Install Command</label>
                <div class="relative">
                  <input 
                    type="text" 
                    id="installCommand" 
                    v-model="project.installCommand" 
                    class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="npm install"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">Command to install dependencies (e.g., npm install, yarn)</p>
              </div>

              <!-- Build Command Field -->
              <div class="relative mb-6">
                <label for="buildCommand" class="block text-sm font-medium text-gray-700 mb-1">Build Command</label>
                <div class="relative">
                  <input 
                    type="text" 
                    id="buildCommand" 
                    v-model="project.buildCommand" 
                    class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="npm run build"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">Command to build the project (e.g., npm run build)</p>
              </div>

              <!-- Start Command Field -->
              <div class="relative mb-6">
                <label for="startCommand" class="block text-sm font-medium text-gray-700 mb-1">Start Command</label>
                <div class="relative">
                  <input 
                    type="text" 
                    id="startCommand" 
                    v-model="project.startCommand" 
                    class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="npm start"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">Command to start the project (e.g., npm start, node server.js)</p>
              </div>

              <!-- Output Directory Field -->
              <div class="relative mb-3">
                <label for="outputDirectory" class="block text-sm font-medium text-gray-700 mb-1">Output Directory</label>
                <div class="relative">
                  <input 
                    type="text" 
                    id="outputDirectory" 
                    v-model="project.outputDirectory" 
                    class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="dist"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">Directory where build output is located (e.g., dist, build)</p>
              </div>
            </div>

            <!-- Auto Deployment Configuration Section -->
            <div class="pt-2 pb-1">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Auto Deployment Configuration</h3>
              
              <!-- GitHub App Integration -->
              <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-blue-700">
                      <strong>GitHub App Integration:</strong> To enable auto-deployments, install the Ocean GitHub App on your repository. 
                      This will automatically set up webhooks and provide secure access for deployments.
                    </p>
                    <div class="mt-3 flex items-center">
                      <button 
                        type="button" 
                        @click="openGitHubAppInstallation"
                        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        :disabled="checkingGithubApp || githubAppInstalled"
                      >
                        <svg class="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span v-if="!checkingGithubApp && !githubAppInstalled">Install GitHub App</span>
                        <span v-else-if="checkingGithubApp">Checking...</span>
                        <span v-else>Already Installed</span>
                      </button>
                      
                      <div v-if="checkingGithubApp" class="ml-3 flex items-center">
                        <div class="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                        <span class="ml-2 text-sm text-gray-600">Checking installation status...</span>
                      </div>
                      
                      <div v-else-if="githubAppInstalled" class="ml-3 flex items-center text-green-600">
                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        <span class="ml-1 text-sm">GitHub App is installed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="relative mb-3" v-if="project?.githubInstallationId">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <span class="ml-2 text-sm font-medium text-gray-700">GitHub App is installed and auto-deployments are enabled</span>
                </div>
                <p class="mt-2 text-sm text-gray-500">Installation ID: {{ project.githubInstallationId }}</p>
              </div>
              
              <div class="relative mb-6" v-if="!project?.githubInstallationId">
                <label for="webhookSecret" class="block text-sm font-medium text-gray-700 mb-1">Webhook Secret (Manual Setup)</label>
                <div class="relative">
                  <input 
                    type="text" 
                    id="webhookSecret" 
                    v-model="project.webhookSecret" 
                    class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter a secret key for webhook verification"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">Secret key used to verify manual GitHub webhook requests (leave empty to disable verification)</p>
              </div>
            </div>

            <!-- Status Field -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div class="mt-1 flex items-center space-x-6">
                <label class="inline-flex items-center">
                  <input type="radio" v-model="project.active" :value="true" class="focus:ring-blue-500 h-5 w-5 text-blue-600 border-gray-300" />
                  <span class="ml-2 text-base text-gray-700">Active</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" v-model="project.active" :value="false" class="focus:ring-blue-500 h-5 w-5 text-blue-600 border-gray-300" />
                  <span class="ml-2 text-base text-gray-700">Inactive</span>
                </label>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end pt-4">
              <button 
                type="button" 
                @click="$router.push(`/projects/${project.id}`)" 
                class="mr-4 group relative flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                :disabled="isSubmitting"
              >
                <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-4.418 3.582-8 8-8v4c-2.209 0-4 1.791-4 4s1.791 4 4 4v4c-4.418 0-8-3.582-8-8z"></path>
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjects } from '~/composables/useProjects'
import { useToast } from '~/composables/useToast'
import { useGithub } from '~/composables/useGithub'
import type { Project } from '~/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { updateProject, fetchProject } = useProjects()
const { getInstallationUrl, checkGitHubAppInstallation, extractOwnerAndRepo } = useGithub()

const project = ref<Project | null>(null)
const loading = ref(true)
const isSubmitting = ref(false)
const checkingGithubApp = ref(false)
const githubAppInstalled = ref(false)

const errors = reactive({
  name: '',
  repositoryUrl: ''
})

// GitHub App installation URL
const githubAppInstallUrl = ref('')

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    if (!isNaN(id)) {
      project.value = await fetchProject(id)
      
      // Fetch GitHub App installation URL
      try {
        githubAppInstallUrl.value = await getInstallationUrl()
        
        // Check GitHub App installation status if we have a repository URL
        if (project.value?.repositoryUrl) {
          await checkGitHubAppStatus()
        }
      } catch (err) {
        console.error('Error fetching GitHub App installation URL:', err)
      }
    }
  } catch (error) {
    console.error('Error fetching project:', error)
    toast.error('Error loading project', 'Please try again later.')
  } finally {
    loading.value = false
  }
})

const validateField = (field: string) => {
  if (!project.value) return false
  
  if (field === 'name') {
    if (!project.value.name) {
      errors.name = 'Project name is required'
      return false
    } else if (project.value.name.length < 3) {
      errors.name = 'Project name must be at least 3 characters'
      return false
    } else {
      errors.name = ''
      return true
    }
  }
  
  if (field === 'repositoryUrl') {
    if (!project.value.repositoryUrl) {
      errors.repositoryUrl = 'Repository URL is required'
      return false
    } else if (!isValidUrl(project.value.repositoryUrl)) {
      errors.repositoryUrl = 'Please enter a valid repository URL'
      return false
    } else {
      // Check GitHub App installation status when repository URL changes
      checkGitHubAppStatus()
      
      errors.repositoryUrl = ''
      return true
    }
  }
  
  return true
}

const isValidUrl = (url: string) => {
  return /^(https?:\/\/|git@)([\w.-]+)(\/|:)[\w.-]+\/[\w.-]+(\.[\w.-]+)?(\.git)?$/.test(url)
}

const checkGitHubAppStatus = async () => {
  if (!project.value?.repositoryUrl) return;
  
  const repoInfo = extractOwnerAndRepo(project.value.repositoryUrl);
  if (!repoInfo) return;
  
  checkingGithubApp.value = true;
  try {
    const { owner, repo } = repoInfo;
    const status = await checkGitHubAppInstallation(owner, repo);
    
    githubAppInstalled.value = status.installed;
    
    // If app is installed but project doesn't have installation ID, update it
    if (status.installed && status.installationId && !project.value.githubInstallationId) {
      project.value.githubInstallationId = status.installationId;
    }
  } catch (err) {
    console.error('Error checking GitHub App status:', err);
  } finally {
    checkingGithubApp.value = false;
  }
}

const openGitHubAppInstallation = () => {
  if (githubAppInstallUrl.value) {
    window.open(githubAppInstallUrl.value, '_blank')
  } else {
    toast.error('GitHub App installation URL not available', 'Please try again later')
  }
}

const validateAndSaveProject = async () => {
  if (!project.value) return
  
  const nameValid = validateField('name')
  const repoValid = validateField('repositoryUrl')
  
  if (!nameValid || !repoValid) {
    toast.warning('Please fix the errors', 'Some fields need your attention')
    return
  }
  
  isSubmitting.value = true
  
  try {
    const id = Number(route.params.id)
    if (!isNaN(id)) {
      const result = await updateProject(id, project.value)
      if (result) {
        toast.success('Project updated successfully', 'Your changes have been saved')
        router.push(`/projects/${id}`)
      } else {
        toast.error('Failed to update project', 'Please try again.')
      }
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>