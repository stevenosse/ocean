<template>
  <div class="mb-4">
    <div class="bg-white rounded-lg overflow-hidden p-3">
      <div v-if="loading" class="flex justify-center items-center my-2">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600">
          <span class="sr-only">Loading...</span>
        </div>
      </div>
      <div v-else class="space-y-2">
        <div class="flex items-center text-sm">
          <div class="flex-shrink-0 mr-2">
            <svg v-if="tunnelActive" class="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span class="font-medium" :class="tunnelActive ? 'text-green-700' : 'text-blue-700'">
              {{ tunnelActive ? 'Tunnel Active' : 'Automatic Tunnel Management' }}
            </span>
            <span class="text-xs text-gray-500 ml-1">{{ tunnelActive ? '• Secure access enabled' : '• Auto-managed' }}</span>
          </div>
        </div>

        <div v-if="tunnelConnectionString" class="mt-1">
          <div class="flex items-center">
            <input
              type="text"
              class="flex-grow rounded-l-md border border-gray-300 px-2 py-1 text-xs font-mono bg-gray-50 h-8"
              readonly
              :value="tunnelConnectionString"
            />
            <button
              class="inline-flex items-center px-2 py-1 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 h-8"
              type="button"
              @click="copyConnectionString"
              title="Copy to clipboard"
            >
              <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="tunnelActive" class="mt-1">
          <button
            class="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            @click="restartTunnel"
            :disabled="loading"
          >
            <svg class="mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Restart
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDatabaseTunnelingApi } from '~/composables/useDatabaseTunnelingApi'
import { useToast } from '~/composables/useToast'

const props = defineProps({
  databaseId: {
    type: Number,
    required: true
  }
})

const tunnelApi = useDatabaseTunnelingApi()
const toast = useToast()

const loading = ref(false)
const tunnelActive = ref(false)
const tunnelConnectionString = ref(null)

onMounted(async () => {
  await fetchTunnelInfo()
})

async function fetchTunnelInfo() {
  loading.value = true
  try {
    const connectionString = await tunnelApi.getConnectionString(props.databaseId)
    if (connectionString) {
      tunnelConnectionString.value = connectionString
      tunnelActive.value = await tunnelApi.isTunnelActive(props.databaseId)
    }
  } catch (error) {
    console.error('Error fetching tunnel information:', error)
  } finally {
    loading.value = false
  }
}

async function restartTunnel() {
  loading.value = true
  try {
    tunnelConnectionString.value = await tunnelApi.restartTunnel(props.databaseId)
    if (tunnelConnectionString.value) {
      tunnelActive.value = true
      toast.success('Database tunnel restarted successfully')
    }
  } catch (error) {
    console.error('Error restarting tunnel:', error)
    toast.error('Failed to restart database tunnel')
  } finally {
    loading.value = false
  }
}

function copyConnectionString() {
  if (tunnelConnectionString.value) {
    navigator.clipboard.writeText(tunnelConnectionString.value)
    toast.success('Connection string copied to clipboard')
  }
}
</script>