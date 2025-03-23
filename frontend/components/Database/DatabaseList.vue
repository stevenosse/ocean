<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-10">
      <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    
    <div v-else-if="databases.length === 0" class="text-center py-10">
      <p class="text-gray-600 mb-4">No databases found</p>
      <button 
        @click="$emit('create-database')" 
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none"
      >
        Create Database
      </button>
    </div>
    
    <div v-else class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr class="bg-gray-100">
            <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Name</th>
            <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Host</th>
            <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Port</th>
            <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Username</th>
            <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Status</th>
            <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Created</th>
            <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="database in databases" :key="database.id" class="hover:bg-gray-50">
            <td class="py-3 px-4 text-sm">{{ database.name }}</td>
            <td class="py-3 px-4 text-sm">{{ database.host }}</td>
            <td class="py-3 px-4 text-sm">{{ database.port }}</td>
            <td class="py-3 px-4 text-sm">{{ database.username }}</td>
            <td class="py-3 px-4 text-sm">
              <span 
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="{
                  'bg-green-100 text-green-800': database.status === 'running',
                  'bg-yellow-100 text-yellow-800': database.status === 'starting',
                  'bg-red-100 text-red-800': database.status === 'stopped'
                }"
              >
                {{ database.status || 'running' }}
              </span>
            </td>
            <td class="py-3 px-4 text-sm">{{ formatDate(database.createdAt) }}</td>
            <td class="py-3 px-4 text-sm space-x-2">
              <button 
                @click="$emit('show-connection', database)" 
                class="text-blue-600 hover:text-blue-900 mr-3"
                title="View connection details"
              >
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button 
                @click="$emit('create-backup', database.id)" 
                :disabled="backupInProgress"
                class="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Create backup"
              >
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </button>
              <button 
                @click="$emit('delete-database', database)" 
                class="text-red-600 hover:text-red-900"
                title="Delete database"
              >
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import type { ManagedDatabase } from '~/types';

const props = defineProps<{
  databases: ManagedDatabase[];
  loading: boolean;
  backupInProgress: boolean;
}>();

defineEmits<{
  (e: 'create-database'): void;
  (e: 'show-connection', database: ManagedDatabase): void;
  (e: 'create-backup', databaseId: number): void;
  (e: 'delete-database', database: ManagedDatabase): void;
}>();

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};
</script>
