<template>
  <div class="max-w-3xl w-full mx-auto space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">New Project</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        <NuxtLink to="/projects" class="font-medium text-blue-600 hover:text-blue-500 inline-flex items-center">
          <svg class="-ml-1 mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to Projects
        </NuxtLink>
      </p>
    </div>

    <div class="bg-white shadow-md overflow-hidden sm:rounded-lg border border-gray-100">
      <div class="px-6 py-6 sm:p-8">
        <form @submit.prevent="validateAndSaveProject" class="mt-8 space-y-6">
          <div class="space-y-8">
            <!-- Project Name Field -->
            <div class="relative">
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Project Name <span
                  class="text-red-500">*</span></label>
              <div class="relative">
                <input type="text" id="name" v-model="project.name"
                  :class="['appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm',
                    errors.name ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300']"
                  @blur="validateField('name')" placeholder="Enter project name" />
                <div v-if="errors.name" class="mt-2 text-sm text-red-600">
                  {{ errors.name }}
                </div>
              </div>
            </div>

            <!-- Repository URL Field -->
            <div class="relative">
              <label for="repositoryUrl" class="block text-sm font-medium text-gray-700 mb-1">Repository URL <span
                  class="text-red-500">*</span></label>
              <div class="relative">
                <input type="text" id="repositoryUrl" v-model="project.repositoryUrl"
                  :class="['appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm',
                    errors.repositoryUrl ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300']"
                  @blur="validateField('repositoryUrl')" placeholder="https://github.com/username/repo.git" />
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
                <input type="text" id="branch" v-model="project.branch"
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="main" />
              </div>
              <p class="mt-2 text-sm text-gray-500">The Git branch to deploy (defaults to main/master)</p>
            </div>

            <!-- Root Folder Field -->
            <div class="relative">
              <label for="rootFolder" class="block text-sm font-medium text-gray-700 mb-1">Root Folder</label>
              <div class="relative">
                <input type="text" id="rootFolder" v-model="project.rootFolder"
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="/" />
              </div>
              <p class="mt-2 text-sm text-gray-500">The root folder path where the docker-compose file is located
                (defaults to repository root)</p>
            </div>

            <!-- Build Configuration Section -->
            <div class="pt-2 pb-1">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Build Configuration</h3>

              <!-- Install Command Field -->
              <div class="relative mb-6">
                <label for="installCommand" class="block text-sm font-medium text-gray-700 mb-1">Install Command</label>
                <div class="relative">
                  <input type="text" id="installCommand" v-model="project.installCommand"
                    class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="npm install" />
                </div>
                <p class="mt-2 text-sm text-gray-500">Command to install dependencies (e.g., npm install, yarn)</p>
              </div>

              <!-- Build Command Field -->
              <div class="relative mb-6">
                <label for="buildCommand" class="block text-sm font-medium text-gray-700 mb-1">Build Command</label>
                <div class="relative">
                  <input type="text" id="buildCommand" v-model="project.buildCommand"
                    class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="npm run build" />
                </div>
                <p class="mt-2 text-sm text-gray-500">Command to build the project (e.g., npm run build)</p>
              </div>

              <!-- Start Command Field -->
              <div class="relative mb-6">
                <label for="startCommand" class="block text-sm font-medium text-gray-700 mb-1">Start Command</label>
                <div class="relative">
                  <input type="text" id="startCommand" v-model="project.startCommand"
                    class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="npm start" />
                </div>
                <p class="mt-2 text-sm text-gray-500">Command to start the project (e.g., npm start, node server.js)</p>
              </div>

              <!-- Output Directory Field -->
              <div class="relative mb-6">
                <label for="outputDirectory" class="block text-sm font-medium text-gray-700 mb-1">Output
                  Directory</label>
                <div class="relative">
                  <input type="text" id="outputDirectory" v-model="project.outputDirectory"
                    class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="dist" />
                </div>
                <p class="mt-2 text-sm text-gray-500">Directory where build output is located (e.g., dist, build)</p>
              </div>
            </div>

            <!-- Webhook Secret Field -->
            <div class="relative">
              <label for="webhookSecret" class="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
              <div class="relative">
                <input type="text" id="webhookSecret" v-model="project.webhookSecret"
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter webhook secret" />
              </div>
              <p class="mt-2 text-sm text-gray-500">Secret for webhook authentication (optional)</p>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end pt-4">
              <button type="button" @click="$router.push('/projects')"
                class="mr-4 group relative flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cancel
              </button>
              <button type="submit"
                class="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                :disabled="isSubmitting">
                <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-4.418 3.582-8 8-8v4c-2.209 0-4 1.791-4 4s1.791 4 4 4v4c-4.418 0-8-3.582-8-8z">
                  </path>
                </svg>
                Create Project
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useProjects } from '~/composables/useProjects'
import { useToast } from '~/composables/useToast'
import type { Project } from '~/types'

const router = useRouter()
const toast = useToast()
const config = useRuntimeConfig()
const baseURL = config.public.apiBaseUrl

const { createProject } = useProjects()

const project = ref<Partial<Project>>({
  name: '',
  repositoryUrl: '',
  branch: '',
  rootFolder: '',
  dockerComposeFile: '',
  dockerServiceName: '',
  webhookSecret: '',
  buildCommand: '',
  startCommand: '',
  installCommand: '',
  outputDirectory: '',
  active: true
})

const errors = reactive({
  name: '',
  repositoryUrl: ''
})

const isSubmitting = ref(false)

const validateField = (field: string) => {
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
  const nameValid = validateField('name')
  const repoValid = validateField('repositoryUrl')

  if (!nameValid || !repoValid) {
    toast.warning('Please fix the errors', 'Some fields need your attention')
    return
  }

  isSubmitting.value = true

  const result = await createProject(project.value)

  if (result) {
    if (project.value.repositoryUrl?.includes('github.com')) {
      const width = 800
      const height = 600
      const left = (window.innerWidth - width) / 2
      const top = (window.innerHeight - height) / 2
      window.open(
        `${baseURL}/github/install?projectId=${result.id}`,
        'github_install',
        `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no`
      )
    }
    
    toast.success('Project created successfully', 'Your new project is ready')
    router.push(`/projects/${result.id}`)
  }
  
  isSubmitting.value = false
}
</script>