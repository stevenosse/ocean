<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Environment Variables</h1>
      <NuxtLink :to="`/projects/${$route.params.id}`"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm">
        <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Back to Project
      </NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-10">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-500">Loading environment variables...</p>
    </div>

    <div v-else class="bg-white shadow-md overflow-hidden sm:rounded-lg border border-gray-100 mb-8">
      <div class="px-6 py-5 border-b border-gray-200">
        <h3 class="text-lg leading-6 font-medium text-gray-900 flex items-center justify-between">
          <span>Environment Variables</span>
          <button @click="openAddModal"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Variable
          </button>
        </h3>
        <p class="mt-2 text-sm text-gray-500">Changes to environment variables will automatically trigger a redeployment
          of your project in a Docker container.</p>
      </div>

      <div v-if="environments.length === 0" class="px-6 py-10 text-center text-gray-500">
        No environment variables defined for this project.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="env in environments" :key="env.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ env.key }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span v-if="env.isSecret" class="font-mono">••••••••</span>
                <span v-else class="font-mono">{{ env.value.length > 6 ? env.value.substring(0, 6) +
        '•'.repeat(env.value.length - 6) : env.value }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                <button @click="editEnvironment(env)" class="text-blue-600 hover:text-blue-900">
                  Edit
                </button>
                <button @click="confirmDelete(env)" class="text-red-600 hover:text-red-900">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">{{ isEditing ? 'Edit Environment Variable' : 'Add environment variable' }}</h3>
        </div>
        <form @submit.prevent="saveEnvironment">
          <div class="px-6 py-4 space-y-4">
            <div>
              <label for="key" class="block text-sm font-medium text-gray-700 mb-1">Key <span
                  class="text-red-500">*</span></label>
              <input type="text" id="key" v-model="currentEnv.key"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                :disabled="isEditing" placeholder="DATABASE_URL" />
              <p v-if="errors.key" class="mt-1 text-sm text-red-600">{{ errors.key }}</p>
            </div>
            <div>
              <label for="value" class="block text-sm font-medium text-gray-700 mb-1">Value <span
                  class="text-red-500">*</span></label>
              <input type="text" id="value" v-model="currentEnv.value"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="postgres://user:password@localhost:5432/db" />
              <p v-if="errors.value" class="mt-1 text-sm text-red-600">{{ errors.value }}</p>
            </div>
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input id="isSecret" type="checkbox" v-model="currentEnv.isSecret"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" />
              </div>
              <div class="ml-3 text-sm">
                <label for="isSecret" class="font-medium text-gray-700">Secret Value</label>
                <p class="text-gray-500">Mark as secret to hide the value in the UI</p>
              </div>
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
            <button type="button" @click="closeModal"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancel
            </button>
            <button type="submit"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              :disabled="isSubmitting">
              <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-4.418 3.582-8 8-8v4c-2.209 0-4 1.791-4 4s1.791 4 4 4v4c-4.418 0-8-3.582-8-8z">
                </path>
              </svg>
              {{ isEditing ? 'Update' : 'Add' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Confirm Deletion</h3>
        </div>
        <div class="px-6 py-4">
          <p class="text-gray-700">Are you sure you want to delete the environment variable <span
              class="font-semibold">{{ envToDelete?.key }}</span>?</p>
          <p class="text-gray-500 mt-2">This action cannot be undone.</p>
        </div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button type="button" @click="showDeleteModal = false"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Cancel
          </button>
          <button type="button" @click="deleteEnvironment"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            :disabled="isDeleting">
            <svg v-if="isDeleting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-4.418 3.582-8 8-8v4c-2.209 0-4 1.791-4 4s1.791 4 4 4v4c-4.418 0-8-3.582-8-8z">
              </path>
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '~/composables/useToast'
import { useApi } from '~/composables/useApi'
import type { Environment } from '~/types'

const route = useRoute()
const toast = useToast()
const api = useApi()

const environments = ref<Environment[]>([])
const loading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const envToDelete = ref<Environment | null>(null)

const currentEnv = reactive<Environment>({
  projectId: Number(route.params.id),
  key: '',
  value: '',
  isSecret: false
})

const errors = reactive({
  key: '',
  value: ''
})

onMounted(async () => {
  await fetchEnvironments()
})

const fetchEnvironments = async () => {
  loading.value = true
  try {
    const projectId = Number(route.params.id)
    if (!isNaN(projectId)) {
      environments.value = await api.fetchEnvironments(projectId)
    }
  } catch (error) {
    console.error('Error fetching environments:', error)
    toast.error('Failed to load environment variables', 'Please try again.')
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  Object.assign(currentEnv, {
    projectId: Number(route.params.id),
    key: '',
    value: '',
    isSecret: false
  })

  errors.key = ''
  errors.value = ''

  isEditing.value = false
  showModal.value = true
}

const editEnvironment = (env: Environment) => {
  Object.assign(currentEnv, {
    id: env.id,
    projectId: env.projectId,
    key: env.key,
    value: env.value,
    isSecret: env.isSecret
  })

  errors.key = ''
  errors.value = ''

  isEditing.value = true
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const validateForm = (): boolean => {
  let isValid = true

  if (!currentEnv.key) {
    errors.key = 'Key is required'
    isValid = false
  } else if (!/^[A-Z0-9_]+$/.test(currentEnv.key)) {
    errors.key = 'Key must contain only uppercase letters, numbers, and underscores'
    isValid = false
  } else {
    errors.key = ''
  }

  if (!currentEnv.value) {
    errors.value = 'Value is required'
    isValid = false
  } else {
    errors.value = ''
  }

  return isValid
}

const saveEnvironment = async () => {
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    const projectId = Number(route.params.id)
    if (isNaN(projectId)) throw new Error('Invalid project ID')

    if (isEditing.value && currentEnv.id) {
      const result = await api.updateEnvironment(currentEnv.id, {
        value: currentEnv.value,
        isSecret: currentEnv.isSecret
      })
      if (result) {
        toast.success('Environment variable updated successfully', 'A redeployment has been triggered')
      } else {
        throw new Error('Failed to update environment variable')
      }
    } else {
      const result = await api.createEnvironment(currentEnv)
      if (result) {
        toast.success('Environment variable added successfully', 'A redeployment has been triggered')
      } else {
        throw new Error('Failed to create environment variable')
      }
    }

    await fetchEnvironments()
    closeModal()
  } catch (error) {
    console.error('Error saving environment:', error)
    toast.error('Failed to save environment variable', 'Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (env: Environment) => {
  envToDelete.value = env
  showDeleteModal.value = true
}

const deleteEnvironment = async () => {
  if (!envToDelete.value || !envToDelete.value.id) return

  isDeleting.value = true

  try {
    const success = await api.deleteEnvironment(envToDelete.value.id)

    if (success) {
      toast.success('Environment variable deleted successfully', 'A redeployment has been triggered')
      showDeleteModal.value = false
    } else {
      throw new Error('Failed to delete environment variable')
    }

    await fetchEnvironments()
  } catch (error) {
    console.error('Error deleting environment:', error)
    toast.error('Failed to delete environment variable', 'Please try again.')
  } finally {
    isDeleting.value = false
  }
}
</script>
~/composables/useApi-legacy