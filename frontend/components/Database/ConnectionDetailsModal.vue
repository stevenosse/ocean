<template>
  <div v-if="show && database" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Database Connection Details</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 focus:outline-none">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-1">Connection Details</h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="font-medium">Host:</div>
            <div>{{ database.host }}</div>
            
            <div class="font-medium">Port:</div>
            <div>{{ database.port }}</div>
            
            <div class="font-medium">Database:</div>
            <div>{{ database.name }}</div>
            
            <div class="font-medium">Username:</div>
            <div>{{ database.username }}</div>
            
            <div class="font-medium">Password:</div>
            <div class="flex items-center">
              <span v-if="showPassword">{{ database.password }}</span>
              <span v-else>••••••••</span>
              <button
                @click="$emit('toggle-password')"
                class="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                :title="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="showPassword" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <svg v-else class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-1">Connection String</h3>
          <div class="relative">
            <div v-if="isLoading" class="p-3 bg-gray-50 rounded border border-gray-200 text-sm flex justify-center items-center h-16">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span class="ml-2 text-gray-600">Loading connection details...</span>
            </div>
            <div v-else class="p-3 bg-gray-50 rounded border border-gray-200 text-sm font-mono break-all">
              {{ connectionString }}
            </div>
            <button
              v-if="!isLoading"
              @click="$emit('copy')"
              class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              title="Copy to clipboard"
            >
              <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <p v-if="copied" class="text-xs text-green-600 mt-1 flex items-center">
            <svg class="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Copied to clipboard!
          </p>
        </div>

        <div class="flex justify-end">
          <button
            @click="$emit('close')"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ManagedDatabase } from '~/types';

defineProps<{
  show: boolean;
  database: ManagedDatabase | null;
  connectionString: string;
  showPassword: boolean;
  copied: boolean;
  isLoading?: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'toggle-password'): void;
  (e: 'copy'): void;
}>();
</script>
