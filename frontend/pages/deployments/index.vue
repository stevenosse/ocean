<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Deployments</h1>
      <button @click="refreshDeployments" :disabled="loading"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
        <svg :class="[loading ? 'animate-spin' : '', 'mr-2 -ml-1 h-5 w-5']" xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24">
          <circle v-if="loading" class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path v-if="loading" class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          <path v-if="!loading" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white shadow-sm rounded-lg p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Status Filter -->
        <div>
          <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select id="status-filter" v-model="statusFilter"
            class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <!-- Project Filter -->
        <div>
          <label for="project-filter" class="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <input type="text" id="project-filter" v-model="projectFilter" placeholder="Filter by project name"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
        </div>

        <!-- Date Range Filter -->
        <div>
          <label for="date-filter" class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select id="date-filter" v-model="dateFilter"
            class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="bg-white shadow-md rounded-lg p-10 text-center">
      <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-500 font-medium">Loading deployments...</p>
    </div>

    <div v-else-if="filteredDeployments.length === 0" class="bg-white shadow-md rounded-lg overflow-hidden">
      <div class="px-6 py-12 text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        <h3 class="mt-4 text-xl font-medium text-gray-900">No deployments found</h3>
        <p class="mt-2 text-base text-gray-500">{{ deployments.length === 0 ? 'Deployments will appear here when you deploy a project.' : 'No deployments match your current filters.' }}</p>
      </div>
    </div>

    <div v-else class="bg-white shadow-md rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commit</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Started</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="deployment in filteredDeployments" :key="deployment.id"
              class="hover:bg-gray-50 transition-colors duration-150">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    class="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <NuxtLink :to="`/projects/${deployment.projectId}`"
                      class="text-sm font-medium text-blue-600 hover:text-blue-900">
                      {{ deployment.project?.name || `Project #${deployment.projectId}` }}
                    </NuxtLink>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="{
        'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full': true,
        'bg-green-100 text-green-800': deployment.status === 'completed',
        'bg-red-100 text-red-800': deployment.status === 'failed',
        'bg-yellow-100 text-yellow-800': deployment.status === 'pending',
        'bg-blue-100 text-blue-800': deployment.status === 'in_progress',
      }">
                  {{ deployment.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ deployment.commitMessage || 'N/A' }}</div>
                <div class="text-sm text-gray-500">{{ deployment.commitHash || 'N/A' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatDate(deployment.startedAt) }}</div>
                <div class="text-sm text-gray-500">{{ formatTime(deployment.startedAt) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="deployment.status === 'completed'" class="text-sm text-gray-900">{{
        formatDate(deployment.completedAt) }}</div>
                <div v-if="deployment.status === 'completed'" class="text-sm text-gray-500">{{
        formatTime(deployment.completedAt) }}</div>
                <div v-else class="text-sm text-gray-500">N/A</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <NuxtLink :to="`/deployments/${deployment.id}`" class="text-blue-600 hover:text-blue-900">View
                </NuxtLink>
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
import type { Deployment } from '~/types'

const api = useApi()
const deployments = ref<Deployment[]>([])
const loading = ref(true)

const statusFilter = ref('all')
const projectFilter = ref('')
const dateFilter = ref('all')
const filteredDeployments = computed(() => {
  return deployments.value.filter((deployment: Deployment) => {
    const statusMatch = statusFilter.value === 'all' || deployment.status === statusFilter.value
    const projectMatch = projectFilter.value === '' || deployment.project?.name?.toLowerCase().includes(projectFilter.value.toLowerCase())
    const dateMatch = dateFilter.value === 'all' || (
      dateFilter.value === 'today' && isToday(new Date(deployment.startedAt))
    ) || (
      dateFilter.value === 'yesterday' && isYesterday(new Date(deployment.startedAt))
    )
    return statusMatch && projectMatch && dateMatch
  })
})

function isToday(date: Date): boolean {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
}

function formatDate(rawDate: string | undefined): string {
  if (!rawDate) {
    return '--'
  }

  const date = new Date(rawDate)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatTime(rawDate: string | undefined): string {
  if (!rawDate) {
    return '--'
  }
  const date = new Date(rawDate)
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  }).format(date)
}

async function refreshDeployments() {
  loading.value = true
  try {
    deployments.value = await api.fetchDeployments()
  } catch (error) {
    console.error('Error refreshing deployments:', error)
  } finally {
    loading.value = false
  }
}



onMounted(async () => {
  try {
    deployments.value = await api.fetchDeployments()
  } catch (error) {
    console.error('Error fetching deployments:', error)
  } finally {
    loading.value = false
  }
})
</script>~/composables/useApi-legacy