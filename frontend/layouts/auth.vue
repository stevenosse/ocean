<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- Logo or branding could go here -->
      <div class="text-center mb-6">
        <NuxtLink to="/" class="text-3xl font-bold text-blue-600 tracking-tight hover:text-blue-500 transition duration-150">Ocean</NuxtLink>
      </div>
      
      <!-- Main content slot -->
      <slot />
      
      <!-- Footer -->
      <div class="mt-8 text-center text-sm text-gray-500">
        <p>© {{ new Date().getFullYear() }} Ocean. All rights reserved.</p>
      </div>
    </div>
    
    <!-- Toast container for notifications -->
    <ToastContainer />
  </div>
</template>

<script lang="ts" setup>
import ToastContainer from '~/components/Toast/ToastContainer.vue'
</script>