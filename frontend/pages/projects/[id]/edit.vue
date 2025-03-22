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
        <form @submit.prevent="validateAndSaveProject" class="max-w-3xl mx-auto">
          <div class="space-y-8">
            <!-- Project Name Field -->
            <div class="relative">
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Project Name <span class="text-red-500">*</span></label>
              <div class="relative">
                <input 
                  type="text" 
                  id="name" 
                  v-model="project.name" 
                  :class="['block w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-base', 
                    errors.name ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500']"
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
                  :class="['block w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-base', 
                    errors.repositoryUrl ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500']"
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
                  class="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-base"
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
                  class="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-base"
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
                    class="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-base"
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
                    class="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-base"
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
                    class="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-base"
                    placeholder="npm start"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">Command to start the project (e.g., npm start, node server.js)</p>
              </div>

              <!-- Output Directory Field -->
              <div class="relative mb-6">
                <label for="outputDirectory" class="block text-sm font-medium text-gray-700 mb-1">Output Directory</label>
                <div class="relative">
                  <input 
                    type="text" 
                    id="outputDirectory" 
                    v-model="project.outputDirectory" 
                    class="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-base"
                    placeholder="dist"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">Directory where build output is located (e.g., dist, build)</p>
              </div>
            </div>

            <!-- Docker Configuration Section -->
            <div class="pt-2 pb-1">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Docker Configuration</h3>
              
              <!-- Docker Compose File Field -->
              <div class="relative mb-6">
                <label for="dockerComposeFile" class="block text-sm font-medium text-gray-700 mb-1">Docker Compose File</label>
                <div class="relative">
                  <input 
                    type="text" 
                    id="dockerComposeFile" 
                    v-model="project.dockerComposeFile" 
                    class="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-base"
                    placeholder="docker-compose.yml"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">Path to docker-compose.yml (defaults to docker-compose.yml in the root)</p>
              </div>

              <!-- Docker Service Name Field -->
              <div class="relative">
                <label for="dockerServiceName" class="block text-sm font-medium text-gray-700 mb-1">Docker Service Name</label>
                <div class="relative">
                  <input 
                    type="text" 
                    id="dockerServiceName" 
                    v-model="project.dockerServiceName" 
                    class="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-base"
                    placeholder="app"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">The service name in docker-compose.yml to deploy</p>
              </div>
            </div>

            <!-- Webhook Secret Field -->
            <div class="relative">
              <label for="webhookSecret" class="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
              <div class="relative">
                <input 
                  type="text" 
                  id="webhookSecret" 
                  v-model="project.webhookSecret" 
                  class="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-0 transition-colors duration-200 text-base"
                  placeholder="Enter webhook secret"
                />
              </div>
              <p class="mt-2 text-sm text-gray-500">Secret for webhook authentication (optional)</p>
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
                class="mr-4 inline-flex items-center px-5 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="inline-flex items-center px-5 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
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
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import type { Project } from '~/types'

const route = useRoute()
const router = useRouter()
const api = useApi()
const toast = useToast()

const project = ref<Project | null>(null)
const loading = ref(true)
const isSubmitting = ref(false)

const errors = reactive({
  name: '',
  repositoryUrl: ''
})

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    if (!isNaN(id)) {
      project.value = await api.fetchProject(id)
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
      errors.repositoryUrl = ''
      return true
    }
  }
  
  return true
}

const isValidUrl = (url: string) => {
  return /^(https?:\/\/|git@)([\w.-]+)(\/|:)[\w.-]+\/[\w.-]+(\.[\w.-]+)?(\.git)?$/.test(url)
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
      const result = await api.updateProject(id, project.value)
      if (result) {
        toast.success('Project updated successfully', 'Your changes have been saved')
        router.push(`/projects/${id}`)
      } else {
        toast.error('Failed to update project', 'Please try again.')
      }
    }
  } catch (error) {
    console.error('Error updating project:', error)
    toast.error('Failed to update project', 'Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>