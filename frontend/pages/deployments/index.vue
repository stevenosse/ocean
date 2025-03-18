<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Deployments</h1>
    </div>

    <div v-if="loading" class="text-center py-10">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-500">Loading deployments...</p>
    </div>

    <div v-else-if="deployments.length === 0" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">No deployments</h3>
        <p class="mt-1 text-sm text-gray-500">Deployments will appear here when you deploy a project.</p>
      </div>
    </div>

    <div v-else class="bg-white shadow overflow-hidden sm:rounded-lg">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commit</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="deployment in deployments" :key="deployment.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              <NuxtLink :to="`/projects/${deployment.projectId}`" class="text-blue-600 hover:text-blue-900">
                {{ deployment.project?.name || `Project #${deployment.projectId}` }}
              </NuxtLink>
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
              <span v-if="deployment.commitMessage" class="ml-2 text-xs">{{ deployment.commitMessage }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ new Date(deployment.startedAt).toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ deployment.completedAt ? new Date(deployment.completedAt).toLocaleString() : '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <NuxtLink :to="`/deployments/${deployment.id}`" class="text-blue-600 hover:text-blue-900">View details</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import type { Deployment } from '~/types'

const api = useApi()
const deployments = ref<Deployment[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    deployments.value = await api.fetchDeployments()
  } catch (error) {
    console.error('Error fetching deployments:', error)
  } finally {
    loading.value = false
  }
})
</script>