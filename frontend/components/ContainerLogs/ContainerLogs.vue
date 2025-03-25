<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-lg">
    <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
      <div>
        <h3 class="text-lg leading-6 font-medium text-gray-900">Container Logs</h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">Live logs from the Docker container.</p>
      </div>
      <div class="flex space-x-2">
        <button
          @click="copyLogsToClipboard"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          :disabled="!logs.length || loading"
        >
          <svg class="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copy
        </button>
        <button
          @click="fetchLogs"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          :disabled="loading"
        >
          <svg
            class="-ml-0.5 mr-2 h-4 w-4"
            :class="{ 'animate-spin': loading }"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              v-if="loading"
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              v-if="loading"
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
            <path
              v-else
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {{ loading ? 'Fetching...' : 'Refresh Logs' }}
        </button>
      </div>
    </div>
    <div class="border-t border-gray-200">
      <div
        ref="logsContainer"
        class="bg-gray-900 p-4 font-mono text-sm text-gray-300 overflow-auto relative"
        style="height: 500px;"
      >
        <div v-if="error" class="flex items-center justify-center h-full">
          <div class="text-center py-4 text-red-500 bg-red-100 bg-opacity-10 px-4 rounded-md">
            <svg class="h-10 w-10 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{{ error }}</p>
          </div>
        </div>
        <div v-else-if="loading && !logs.length" class="flex items-center justify-center h-full">
          <div class="text-center py-4">
            <svg class="animate-spin h-10 w-10 mx-auto mb-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Fetching container logs...</p>
          </div>
        </div>
        <div v-else-if="!logs.length" class="flex items-center justify-center h-full">
          <div class="text-center py-4">
            <svg class="h-10 w-10 mx-auto mb-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No logs available.</p>
          </div>
        </div>
        <div v-else class="relative">
          <div v-for="(log, index) in logs" :key="index" class="log-line group hover:bg-gray-800 px-1 rounded">
            <div class="flex">
              <span class="text-gray-500 select-none mr-2 text-xs w-8 text-right pt-0.5">{{ index + 1 }}</span>
              <pre class="whitespace-pre-wrap break-all flex-1"><span v-html="formatLog(log)" /></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import AnsiToHtml from 'ansi-to-html'
import { useToast } from '~/composables/useToast'
import { useProjects } from '~/composables/useProjects';

const props = defineProps<{
  projectId: number
}>()

const toast = useToast()
const logs = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const logsContainer = ref<HTMLElement | null>(null)
const autoScroll = ref(true)

const ansiToHtml = new AnsiToHtml({
  fg: '#FFF',
  bg: '#000',
  newline: false,
  escapeXML: true,
  stream: false,
  colors: {
    0: '#FF0000',
    1: '#FFA500',
    2: '#00FF00',
    3: '#00FFFF',
    4: '#FFFFFF',
    5: '#FF00FF'
  }
})

const { fetchProjectLogs } = useProjects()

const fetchLogs = async () => {
  if (loading.value) return
  
  loading.value = true
  error.value = null
  
  try {
    const logData = await fetchProjectLogs(props.projectId)
    
    if (logData) {
      logs.value = logData.filter(line => line.trim() !== '')
      
      if (autoScroll.value) {
        await nextTick()
        scrollToBottom()
      }
    } else {
      logs.value = []
    }
  } catch (err) {
    console.error('Error fetching logs:', err)
    error.value = err instanceof Error ? err.message : 'Failed to fetch logs'
  } finally {
    loading.value = false
  }
}

const formatLog = (log: string) => {
  return ansiToHtml.toHtml(log)
}
const copyLogsToClipboard = async () => {
  if (!logs.value.length) return
  
  try {
    await navigator.clipboard.writeText(logs.value.join('\n'))
    toast.success('Logs copied to clipboard')
  } catch (err) {
    toast.error('Failed to copy logs to clipboard')
  }
}

const scrollToBottom = () => {
  if (logsContainer.value) {
    logsContainer.value.scrollTop = logsContainer.value.scrollHeight
  }
}

const handleScroll = () => {
  if (!logsContainer.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = logsContainer.value
  autoScroll.value = scrollHeight - scrollTop - clientHeight < 50
}
watch(logs, () => {
  if (autoScroll.value) {
    nextTick(scrollToBottom)
  }
})

onMounted(() => {
  fetchLogs()
  
  if (logsContainer.value) {
    logsContainer.value.addEventListener('scroll', handleScroll)
  }
})

onBeforeUnmount(() => {
  if (logsContainer.value) {
    logsContainer.value.removeEventListener('scroll', handleScroll)
  }
})

</script>