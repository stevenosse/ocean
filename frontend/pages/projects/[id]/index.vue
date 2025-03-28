<template>
  <div>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-3 sm:gap-0">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">{{ project?.name }}</h1>
        <p v-if="project?.repositoryUrl" class="mt-1 text-sm text-gray-500 flex items-center overflow-hidden">
          <svg class="mr-1 h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span class="truncate">{{ project.repositoryUrl }}</span>
        </p>
      </div>
      <div class="flex flex-wrap gap-2 sm:space-x-3 w-full sm:w-auto">
        <!-- Primary actions -->
        <button v-if="project && project.active" @click="triggerDeploy"
          class="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto justify-center">
          <svg class="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <span>Deploy Now</span>
        </button>

        <!-- Project settings dropdown -->
        <div class="relative inline-block text-left">
          <div>
            <button type="button" @click="showSettingsMenu = !showSettingsMenu"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
              <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                aria-hidden="true">
                <path fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <div v-if="showSettingsMenu"
            class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10">
            <div class="py-1">
              <NuxtLink :to="`/projects/${$route.params.id}/edit`"
                class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Project
              </NuxtLink>
              <NuxtLink :to="`/projects/${$route.params.id}/environments`"
                class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Environment Variables
              </NuxtLink>
              <NuxtLink :to="`/projects/${$route.params.id}/databases`"
                class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                Managed Databases
              </NuxtLink>
            </div>
            <div class="py-1">
              <button @click="showDeleteModal = true; showSettingsMenu = false"
                class="group flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900">
                <svg class="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-10">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-500">Loading project details...</p>
    </div>

    <div v-else-if="!project" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">Project not found</h3>
        <p class="mt-1 text-sm text-gray-500">The project you're looking for doesn't exist or has been removed.</p>
        <div class="mt-6">
          <NuxtLink to="/projects"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            View all projects
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-else>
      <!-- Tabs Navigation -->
      <div class="border-b border-gray-200 mt-6 sm:mt-8">
        <nav class="-mb-px flex space-x-4 sm:space-x-10 overflow-x-auto pb-1" aria-label="Tabs">
          <button v-for="tab in tabs" :key="tab.name" @click="switchTab(tab.name)" :class="[
            currentTab === tab.name
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-2 border-b-2 font-medium text-sm focus:outline-none transition-all duration-200 flex items-center'
          ]">
            <span class="mr-2">
              <!-- Overview icon -->
              <svg v-if="tab.name === 'Overview'" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <!-- Configuration icon -->
              <svg v-if="tab.name === 'Configuration'" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              <!-- Deployments icon -->
              <svg v-if="tab.name === 'Deployments'" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <!-- Logs icon -->
              <svg v-if="tab.name === 'Logs'" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="mt-4 sm:mt-8 bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
        <!-- Overview Tab -->
        <div v-if="currentTab === 'Overview'" class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-4 sm:py-5 sm:px-6">
            <h3 class="text-base sm:text-lg leading-6 font-medium text-gray-900">Project Overview</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">Basic project information.</p>
          </div>
          <div class="border-t border-gray-200">
            <dl>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Name</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ project.name }}</dd>
              </div>
              <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Repository URL</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ project.repositoryUrl }}</dd>
              </div>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Branch</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ project.branch || 'Default branch' }}
                </dd>
              </div>
              <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Status</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span :class="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': project.active,
                    'bg-red-100 text-red-800': !project.active
                  }">
                    {{ project.active ? 'Active' : 'Inactive' }}
                  </span>
                </dd>
              </div>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Created At</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ new
                  Date(project.createdAt).toLocaleString() }}</dd>
              </div>
              <div v-if="project.applicationUrl" class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Application URL</dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <a :href="project.applicationUrl" target="_blank" class="text-blue-600 hover:text-blue-900">
                    {{ project.applicationUrl }}
                    <svg class="inline-block ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Configuration Tab -->
        <div v-if="currentTab === 'Configuration'" class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Project Configuration</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">Build and deployment settings.</p>
          </div>
          <div class="border-t border-gray-200">
            <dl>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Install Command</dt>
                <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2"
                  :class="project.installCommand ? 'text-gray-900' : 'text-gray-500'">
                  {{ project.installCommand || 'Not specified' }}
                </dd>
              </div>
              <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Build Command</dt>
                <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2"
                  :class="project.buildCommand ? 'text-gray-900' : 'text-gray-500'">
                  {{ project.buildCommand || 'npm run build' }}
                </dd>
              </div>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Start Command</dt>
                <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2"
                  :class="project.startCommand ? 'text-gray-900' : 'text-gray-500'">
                  {{ project.startCommand || 'npm run start' }}
                </dd>
              </div>
              <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">Output Directory</dt>
                <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2"
                  :class="project.outputDirectory ? 'text-gray-900' : 'text-gray-500'">
                  {{ project.outputDirectory || 'dist' }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Logs Tab -->
        <div v-if="currentTab === 'Logs'">
          <ContainerLogs :project-id="Number($route.params.id)" />
        </div>

        <!-- Deployments Tab -->
        <div v-if="currentTab === 'Deployments'" class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900">Recent Deployments</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">History of project deployments and their status.</p>
            </div>
          </div>
          <div class="border-t border-gray-200">

            <div v-if="loadingDeployments" class="text-center py-10">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p class="mt-2 text-gray-500">Loading deployments...</p>
            </div>

            <div v-else-if="deployments.length === 0" class="bg-white shadow overflow-hidden sm:rounded-lg">
              <div class="px-4 py-8 text-center text-gray-500">
                No deployments yet for this project
              </div>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commit</th>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started
                    </th>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed
                    </th>
                    <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="deployment in deployments" :key="deployment.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <span :class="{
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                        'bg-green-100 text-green-800': deployment.status === 'completed',
                        'bg-yellow-100 text-yellow-800': deployment.status === 'pending' || deployment.status === 'in_progress',
                        'bg-red-100 text-red-800': deployment.status === 'failed'
                      }">
                        {{ deployment.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span class="font-mono">{{ deployment.commitHash.substring(0, 7) }}</span>
                      <span v-if="deployment.commitMessage" class="ml-2 text-xs">{{ deployment.commitMessage }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ new Date(deployment.startedAt).toLocaleString() }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ deployment.completedAt ? new Date(deployment.completedAt).toLocaleString() : '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <NuxtLink :to="`/deployments/${deployment.id}`" class="text-blue-600 hover:text-blue-900">View
                        details</NuxtLink>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal :is-open="showDeleteModal" title="Delete Project"
      message="Are you sure you want to delete this project? This action cannot be undone and will remove all associated deployments, databases, and resources."
      confirm-button-text="Delete" @confirm="deleteProject" @close="showDeleteModal = false" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjects } from '~/composables/useProjects'
import { useToast } from '~/composables/useToast'
import type { Project, Deployment } from '~/types'

const route = useRoute()
const { fetchProject, fetchProjectDeployments, triggerDeploy: apiTriggerDeploy, deleteProject: apiDeleteProject } = useProjects()
const project = ref<Project | null>(null)
const deployments = ref<Deployment[]>([])
const loading = ref(true)
const loadingDeployments = ref(true)
const showSettingsMenu = ref(false)

const tabs = [
  { name: 'Overview' },
  { name: 'Configuration' },
  { name: 'Deployments' },
  { name: 'Logs' }
]
const currentTab = ref('Overview')

onMounted(() => {
  const tabParam = route.query.tab as string
  if (tabParam && tabs.some(tab => tab.name === tabParam)) {
    currentTab.value = tabParam
  }
})

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    if (!isNaN(id)) {
      const [projectData, deploymentsData] = await Promise.all([
        fetchProject(id),
        fetchProjectDeployments(id),
      ])

      project.value = projectData
      deployments.value = deploymentsData
    } else {
      console.error('Invalid project ID')
    }
  } finally {
    loading.value = false
    loadingDeployments.value = false
  }
})

const toast = useToast()
const router = useRouter()
const showDeleteModal = ref(false)
const isDeleting = ref(false)

const deleteProject = async () => {
  if (!project.value) return
  isDeleting.value = true

  try {
    const result = await apiDeleteProject(project.value.id)
    if (result) {
      toast.success('Project deleted successfully!')
      router.push('/projects')
    } else {
      toast.error('Failed to delete project', 'Please try again.')
    }
  } finally {
    isDeleting.value = false
    showDeleteModal.value = false
  }
}

const triggerDeploy = async () => {
  if (!project.value) return

  try {
    const result = await apiTriggerDeploy(project.value.id)
    if (result) {
      toast.success('Deployment triggered successfully!')

      loadingDeployments.value = true
      deployments.value = await fetchProjectDeployments(project.value.id)
      loadingDeployments.value = false
    } else {
      toast.error('Failed to trigger deployment', 'Please try again.')
    }
  } finally {
  }
}

const switchTab = (tabName: string) => {
  currentTab.value = tabName

  router.replace({
    query: {
      ...route.query,
      tab: tabName
    }
  })
}
</script>