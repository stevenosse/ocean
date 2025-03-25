<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 transition-opacity" @click="close">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <!-- User icon -->
              <svg class="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Create New User</h3>
              <div class="mt-4">
                <form @submit.prevent="submitForm" class="space-y-4">
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      v-model="formData.email" 
                      required
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input 
                      type="password" 
                      id="password" 
                      v-model="formData.password" 
                      required
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
                    <select 
                      id="role" 
                      v-model="formData.role" 
                      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button 
            @click="submitForm" 
            :disabled="isLoading"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {{ isLoading ? 'Creating...' : 'Create User' }}
          </button>
          <button 
            @click="close" 
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useUsers } from '~/composables/useUsers'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const { createUser } = useUsers()
const isLoading = ref(false)
const error = ref('')

const formData = ref({
  email: '',
  password: '',
  role: 'USER'
})

const submitForm = async () => {
  if (!formData.value.email || !formData.value.password) {
    error.value = 'Email and password are required'
    return
  }
  
  error.value = ''
  isLoading.value = true
  
  const result = await createUser({
    email: formData.value.email,
    password: formData.value.password
  })
  
  if (result) {
    formData.value = {
      email: '',
      password: '',
      role: 'USER'
    }
    
    emit('created')
    emit('close')
  }
  
  isLoading.value = false
}

const close = () => {
  formData.value = {
    email: '',
    password: '',
    role: 'USER'
  }
  error.value = ''
  
  emit('close')
}
</script>