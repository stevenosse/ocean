<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <NuxtLink :to="isAuthenticated ? '/dashboard' : '/'" class="text-blue-600 font-bold text-xl">Ocean</NuxtLink>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8" v-if="isAuthenticated">
              <NuxtLink to="/dashboard" :class="[isActive('/dashboard') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700', 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium']">
                Dashboard
              </NuxtLink>
              <NuxtLink to="/projects" :class="[isActive('/projects') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700', 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium']">
                Projects
              </NuxtLink>
              <NuxtLink to="/deployments" :class="[isActive('/deployments') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700', 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium']">
                Deployments
              </NuxtLink>
              <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin/users" :class="[isActive('/admin/users') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700', 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium']">
                Users
              </NuxtLink>
            </div>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:items-center">
            <div class="ml-3 relative" v-if="isAuthenticated">
              <div class="flex items-center space-x-4">
                <span class="text-sm text-gray-700">{{ user?.email }}</span>
                <button @click="logout" class="text-sm text-red-600 hover:text-red-800">
                  Logout
                </button>
              </div>
            </div>
            <div v-else>
              <NuxtLink to="/auth/login" class="text-sm text-blue-600 hover:text-blue-800 mr-4">
                Login
              </NuxtLink>
              <NuxtLink to="/auth/register" class="text-sm text-blue-600 hover:text-blue-800">
                Register
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main class="py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { useAuth } from '~/composables/useAuth';
import { useRoute } from 'vue-router';
import { onMounted } from 'vue';

const route = useRoute();
const { user, isAuthenticated, logout, initAuth } = useAuth();

onMounted(() => {
  initAuth();
});

const isActive = (path) => {
  return route.path === path || (path !== '/' && route.path.startsWith(path));
};
</script>