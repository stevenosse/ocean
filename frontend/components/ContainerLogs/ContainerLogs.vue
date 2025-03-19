<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-lg">
    <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
      <div>
        <h3 class="text-lg leading-6 font-medium text-gray-900">Container Logs</h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">Live logs from the Docker container.</p>
      </div>
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
    <div class="border-t border-gray-200">
      <div
        ref="logsContainer"
        class="bg-gray-900 p-4 font-mono text-sm text-gray-300 overflow-auto"
        style="height: 400px;"
      >
        <div v-if="error" class="text-center py-4 text-red-500">
          <p>{{ error }}</p>
        </div>
        <div v-else-if="loading && !logs.length" class="text-center py-4">
          <p>Fetching container logs...</p>
        </div>
        <div v-else-if="!logs.length" class="text-center py-4">
          <p>No logs available.</p>
        </div>
        <div v-else>
          <pre v-for="(log, index) in logs" :key="index" class="whitespace-pre-wrap break-all">
            <span v-html="formatLog(log)" />
          </pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue'
import { useApi } from '~/composables/useApi'
import { useAsyncData } from '#app'
import AnsiToHtml from 'ansi-to-html'

const props = defineProps<{
  projectId: number
}>()

const api = useApi()
const logs = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const logsContainer = ref<HTMLElement | null>(null)

// Initialize ansi-to-html with custom options if needed
const ansiToHtml = new AnsiToHtml({
  fg: '#FFF', // Default foreground color (white)
  bg: '#000', // Default background color (black, matches your bg-gray-900)
  newline: false, // We handle newlines ourselves
  escapeXML: true, // Ensure HTML characters are escaped
  stream: false,
})

const scrollToBottom = () => {
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  })
}

// Function to format logs by converting ANSI codes to HTML
const formatLog = (log: string): string => {
  return ansiToHtml.toHtml(log)
}

const fetchLogs = async () => {
  loading.value = true
  error.value = null
  const { data, error: fetchError } = await useAsyncData(`project-logs-${props.projectId}`, () =>
    api.fetchProjectLogs(props.projectId)
  )
  loading.value = false
  if (fetchError.value) {
    console.error('Failed to fetch logs:', fetchError.value)
    error.value = 'Failed to load logs. Please try again.'
    return
  }
  logs.value = data.value || []
  scrollToBottom()
}

fetchLogs()
</script>