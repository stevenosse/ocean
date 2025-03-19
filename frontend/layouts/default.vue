<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl border-b border-blue-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-stretch">
            <div class="flex-shrink-0 flex items-center">
              <NuxtLink to="/" class="text-white text-2xl font-bold tracking-tight hover:text-blue-100 transition duration-150">Ocean</NuxtLink>
            </div>
            <div class="hidden sm:ml-8 sm:flex sm:items-center space-x-1">
              <NuxtLink to="/" class="px-4 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-500 hover:text-white transition duration-150 ease-in-out">Dashboard</NuxtLink>
              <NuxtLink to="/projects" class="px-4 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-500 hover:text-white transition duration-150 ease-in-out">Projects</NuxtLink>
              <NuxtLink to="/deployments" class="px-4 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-500 hover:text-white transition duration-150 ease-in-out">Deployments</NuxtLink>
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