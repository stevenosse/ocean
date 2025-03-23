<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Create New Database</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 focus:outline-none" :disabled="isCreating">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="$emit('submit', database)">
        <div class="mb-4">
          <label for="databaseName" class="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
          <input
            id="databaseName"
            v-model="database.name"
            type="text"
            class="appearance-none relative block rounded-md w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Enter database name"
            required
            :disabled="isCreating"
          />
        </div>
        
        <!-- Error message display -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>
        
        <div class="flex justify-end space-x-2">
          <button
            type="button"
            @click="$emit('close')"
            class="py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isCreating"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isCreating || !database.name"
          >
            <span v-if="isCreating" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
            <span v-else>Create Database</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';
import type { CreateDatabaseDto } from '~/types';

const props = defineProps<{
  show: boolean;
  isCreating: boolean;
  initialValue: CreateDatabaseDto;
  error?: string;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'submit', database: CreateDatabaseDto): void;
}>();

const database = ref<CreateDatabaseDto>({ ...props.initialValue });
const errorMessage = ref<string | null>(props.error || null);

// Reset form when modal is opened/closed
watch(() => props.show, (newValue) => {
  if (newValue) {
    database.value = { ...props.initialValue };
    errorMessage.value = null; // Clear error when reopening
  }
});

// Update database when initialValue changes
watch(() => props.initialValue, (newValue) => {
  database.value = { ...newValue };
});

// Update error message when error prop changes
watch(() => props.error, (newValue) => {
  errorMessage.value = newValue || null;
});
</script>
