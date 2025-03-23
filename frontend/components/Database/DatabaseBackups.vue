<template>
  <div class="mt-6">
    <h3 class="text-lg font-medium text-gray-900 mb-2">Backups</h3>
    
    <div v-if="loading" class="flex justify-center items-center py-6">
      <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    
    <div v-else-if="!backups || backups.length === 0" class="text-center py-6">
      <p class="text-gray-600">No backups found</p>
    </div>
    
    <div v-else class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr class="bg-gray-100">
            <th class="py-2 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">ID</th>
            <th class="py-2 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Size</th>
            <th class="py-2 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Created</th>
            <th class="py-2 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="backup in backups" :key="backup.id" class="hover:bg-gray-50">
            <td class="py-2 px-4 text-sm">{{ backup.id }}</td>
            <td class="py-2 px-4 text-sm">{{ formatSize(backup.size) }}</td>
            <td class="py-2 px-4 text-sm">{{ formatDate(backup.createdAt) }}</td>
            <td class="py-2 px-4 text-sm space-x-2">
              <button
                @click="$emit('restore-backup', backup)"
                class="text-blue-600 hover:text-blue-900 mr-3"
                title="Restore from this backup"
              >
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                @click="$emit('delete-backup', backup)"
                class="text-red-600 hover:text-red-900"
                title="Delete this backup"
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
import type { DatabaseBackup } from '~/types';

const props = defineProps<{
  backups: DatabaseBackup[];
  loading: boolean;
  databaseId: number;
}>();

defineEmits<{
  (e: 'restore-backup', backup: DatabaseBackup): void;
  (e: 'delete-backup', backup: DatabaseBackup): void;
}>();

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>
