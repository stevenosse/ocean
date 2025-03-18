<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Deployment Details</h1>
      <NuxtLink to="/deployments"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Back to Deployments
      </NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-10">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-500">Loading deployment details...</p>
    </div>

    <div v-else-if="!deployment" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">Deployment not found</h3>
        <p class="mt-1 text-sm text-gray-500">The deployment you're looking for doesn't exist or has been removed.</p>
        <div class="mt-6">
          <NuxtLink to="/deployments"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            View all deployments
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Deployment Information</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Details about this deployment.</p>
        </div>
        <div class="border-t border-gray-200">
          <dl>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Project</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <NuxtLink :to="`/projects/${deployment.projectId}`" class="text-blue-600 hover:text-blue-900">
                  {{ deployment.project?.name || `Project #${deployment.projectId}` }}
                </NuxtLink>
              </dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Status</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span :class="{
      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
      'bg-green-100 text-green-800': deployment.status === 'completed',
      'bg-yellow-100 text-yellow-800': deployment.status === 'pending' || deployment.status === 'in_progress',
      'bg-red-100 text-red-800': deployment.status === 'failed'
    }">
                  {{ deployment.status }}
                </span>
              </dd>
            </div>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Commit</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span class="font-mono">{{ deployment.commitHash }}</span>
              </dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Commit Message</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {{ deployment.commitMessage || 'No commit message' }}
              </dd>
            </div>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Started At</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {{ new Date(deployment.startedAt).toLocaleString() }}
              </dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Completed At</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {{ deployment.completedAt ? new Date(deployment.completedAt).toLocaleString() : 'Not completed yet' }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Deployment Logs</h3>
        </div>
        <div class="border-t border-gray-200 p-4">
          <div v-if="!deployment.logs" class="text-center py-8 text-gray-500">
            No logs available for this deployment
          </div>
          <pre v-else
            class="bg-gray-800 text-gray-100 p-4 rounded-md overflow-auto max-h-96">{{ deployment.logs }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useApi } from '~/composables/useApi'
import type { Deployment } from '~/types'

const route = useRoute()
const api = useApi()
const deployment = ref<Deployment | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    if (!isNaN(id)) {
      deployment.value = await api.fetchDeployment(id)
    }
  } catch (error) {
    console.error('Error fetching deployment:', error)
  } finally {
    loading.value = false
  }
})
</script>