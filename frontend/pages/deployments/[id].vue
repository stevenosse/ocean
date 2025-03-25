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
      <!-- Status Banner at the top -->
      <div :class="{
        'mb-6 p-4 rounded-md flex items-center': true,
        'bg-green-50 border border-green-200': deployment.status === 'completed',
        'bg-yellow-50 border border-yellow-200': deployment.status === 'pending' || deployment.status === 'in_progress',
        'bg-red-50 border border-red-200': deployment.status === 'failed'
      }">
        <div :class="{
          'flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center': true,
          'bg-green-100': deployment.status === 'completed',
          'bg-yellow-100': deployment.status === 'pending' || deployment.status === 'in_progress',
          'bg-red-100': deployment.status === 'failed'
        }">
          <svg v-if="deployment.status === 'completed'" class="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else-if="deployment.status === 'pending' || deployment.status === 'in_progress'" class="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="ml-4">
          <h3 :class="{
            'text-lg font-medium': true,
            'text-green-800': deployment.status === 'completed',
            'text-yellow-800': deployment.status === 'pending' || deployment.status === 'in_progress',
            'text-red-800': deployment.status === 'failed'
          }">
            {{ deployment.status === 'completed' ? 'Deployment Successful' : 
               deployment.status === 'pending' ? 'Deployment Pending' :
               deployment.status === 'in_progress' ? 'Deployment In Progress' : 'Deployment Failed' }}
          </h3>
          <div :class="{
            'mt-1 text-sm': true,
            'text-green-700': deployment.status === 'completed',
            'text-yellow-700': deployment.status === 'pending' || deployment.status === 'in_progress',
            'text-red-700': deployment.status === 'failed'
          }">
            {{ deployment.status === 'completed' ? 'This deployment has been successfully completed.' : 
               deployment.status === 'pending' ? 'This deployment is waiting to start.' :
               deployment.status === 'in_progress' ? 'This deployment is currently in progress.' : 'This deployment has failed.' }}
          </div>
        </div>
      </div>

      <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div class="px-4 py-5 sm:px-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900">Deployment Information</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">Details about this deployment.</p>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-200">
          <dl>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Project</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <NuxtLink :to="`/projects/${deployment.projectId}`" class="text-blue-600 hover:text-blue-900 font-medium">
                  {{ deployment.project?.name || `Project #${deployment.projectId}` }}
                </NuxtLink>
              </dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Commit</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span class="font-mono bg-gray-100 px-2 py-1 rounded">{{ deployment.commitHash }}</span>
              </dd>
            </div>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Commit Message</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {{ deployment.commitMessage || 'No commit message' }}
              </dd>
            </div>
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Started At</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {{ new Date(deployment.startedAt).toLocaleString() }}
              </dd>
            </div>
            <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Completed At</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {{ deployment.completedAt ? new Date(deployment.completedAt).toLocaleString() : 'Not completed yet' }}
              </dd>
            </div>
            <div v-if="deployment.status === 'completed' && deployment.project?.applicationUrl"
              class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">Application URL</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <a :href="deployment.project.applicationUrl" target="_blank" class="text-blue-600 hover:text-blue-900 inline-flex items-center">
                  {{ deployment.project.applicationUrl }}
                  <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
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

      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 bg-gray-50">
          <div class="flex items-center justify-between">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Deployment Logs</h3>
            <button @click="refreshDeployment" :disabled="loading"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              <svg :class="[loading ? 'animate-spin' : '', '-ml-0.5 mr-2 h-4 w-4']" xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24">
                <circle v-if="loading" class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                  stroke-width="4" />
                <path v-if="loading" class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                <path v-if="!loading" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Logs
            </button>
          </div>
        </div>
        <div class="border-t border-gray-200 p-4">
          <div v-if="!deployment.logs" class="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
            <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-700">No logs available</h3>
              <p class="mt-1 text-xs text-gray-500">This deployment doesn't have any logs yet.</p>
            </div>
          <pre v-else
            class="bg-gray-800 text-gray-100 p-4 rounded-md overflow-auto max-h-[500px] font-mono text-sm leading-relaxed">{{ deployment.logs }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDeployments } from '~/composables/useDeployments'
import type { Deployment } from '~/types'

const route = useRoute()
const deployment = ref<Deployment | null>(null)
const loading = ref(true)
const { fetchDeployment } = useDeployments()

const refreshDeployment = async () => {
  loading.value = true
  try {
    const id = Number(route.params.id)
    if (!isNaN(id)) {
      deployment.value = await fetchDeployment(id)
    }
  } catch (error) {
    console.error('Error fetching deployment:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    if (!isNaN(id)) {
      deployment.value = await fetchDeployment(id)
    }
  } catch (error) {
    console.error('Error fetching deployment:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.max-h-\[500px\] {
  max-height: 500px;
}
</style>