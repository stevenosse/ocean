<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dt class="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
              <dd class="flex items-baseline">
                <div class="text-2xl font-semibold text-gray-900">{{ projects.length }}</div>
              </dd>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-4 sm:px-6">
          <div class="text-sm flex justify-between items-center">
            <NuxtLink to="/projects" class="font-medium text-blue-600 hover:text-blue-500">View all projects</NuxtLink>
            <NuxtLink to="/projects/new" class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg class="-ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Project
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dt class="text-sm font-medium text-gray-500 truncate">Successful Deployments</dt>
              <dd class="flex items-baseline">
                <div class="text-2xl font-semibold text-gray-900">{{ successfulDeployments }}</div>
              </dd>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-5 sm:px-6">
          <div class="text-sm flex justify-between items-center">
            <NuxtLink to="/deployments" class="font-medium text-blue-600 hover:text-blue-500">View all deployments</NuxtLink>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-red-500 rounded-md p-3">
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dt class="text-sm font-medium text-gray-500 truncate">Failed Deployments</dt>
              <dd class="flex items-baseline">
                <div class="text-2xl font-semibold text-gray-900">{{ failedDeployments }}</div>
              </dd>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-5 sm:px-6">
          <div class="text-sm flex justify-between items-center">
            <NuxtLink to="/deployments" class="font-medium text-blue-600 hover:text-blue-500">View failed deployments</NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
      <div class="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Recent Deployments</h3>
      </div>
      <div v-if="recentDeployments.length === 0" class="px-4 py-5 sm:p-6 text-center text-gray-500">
        No deployments yet
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commit</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="deployment in recentDeployments" :key="deployment.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ deployment.project.name }}
              </td>
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
                <span class="ml-2 text-xs">{{ deployment.commitMessage }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ new Date(deployment.startedAt).toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <NuxtLink :to="`/deployments/${deployment.id}`" class="text-blue-600 hover:text-blue-900">View details</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import type { Project, Deployment } from '~/types'

const api = useApi()
const projects = ref<Project[]>([])
const recentDeployments = ref<Deployment[]>([])

const successfulDeployments = computed(() => {
  return recentDeployments.value.filter(d => d.status === 'completed').length
})

const failedDeployments = computed(() => {
  return recentDeployments.value.filter(d => d.status === 'failed').length
})

onMounted(async () => {
  try {
    const [projectsData, deploymentsData] = await Promise.all([
      api.fetchProjects(),
      api.fetchDeployments()
    ])
    
    projects.value = projectsData
    recentDeployments.value = deploymentsData.slice(0, 5) // Get only the 5 most recent
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }
})
</script>