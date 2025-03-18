<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-blue-600 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <NuxtLink to="/" class="text-white text-xl font-bold">Ocean</NuxtLink>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:items-center">
              <NuxtLink to="/" class="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700">Dashboard</NuxtLink>
              <NuxtLink to="/projects" class="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700">Projects</NuxtLink>
              <NuxtLink to="/deployments" class="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700">Deployments</NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <slot />
      </div>
    </div>
    
    <!-- Toast container for notifications -->
    <ToastContainer />
  </div>
</template>

<script lang="ts" setup>
// TypeScript setup script
import ToastContainer from '~/components/Toast/ToastContainer.vue'
</script>