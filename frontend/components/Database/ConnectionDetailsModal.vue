<template>
  <div v-if="show && database" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
            
            <div class="font-medium">Username:</div>
            <div>{{ database.username }}</div>
            
            <div class="font-medium">Password:</div>
            <div class="flex items-center">
              <span v-if="showPassword">{{ database.password }}</span>
              <span v-else>••••••••</span>
              <button 
                @click="$emit('toggle-password')"
                class="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none text-xs"
                type="button"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-1">Connection String</h3>
          <div class="relative">
            <div class="flex">
              <input
                type="text"
                class="flex-grow rounded-l-md border border-gray-300 px-3 py-2 text-sm font-mono bg-gray-50"
                readonly
                :value="connectionString"
                :type="showPassword ? 'text' : 'password'"
              />
              <button
                class="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                type="button"
                @click="$emit('copy')"
                title="Copy to clipboard"
              >
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <span v-if="copied" class="absolute right-0 mt-1 text-xs text-green-600">Copied!</span>
          </div>
        </div>
        
        <div class="mt-4 flex justify-end">
          <button
            @click="$emit('close')"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            :disabled="isLoading"
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
