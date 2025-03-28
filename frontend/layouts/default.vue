<template>
  <div class="min-h-screen bg-gray-50">
    <ToastContainer />
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <NuxtLink :to="isAuthenticated ? '/dashboard' : '/'" class="text-blue-600 font-bold text-xl">Ocean
              </NuxtLink>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8" v-if="isAuthenticated">
              <NuxtLink to="/dashboard"
                :class="[isActive('/dashboard') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700', 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium']">
                Dashboard
              </NuxtLink>
              <NuxtLink to="/projects"
                :class="[isActive('/projects') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700', 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium']">
                Projects
              </NuxtLink>
              <NuxtLink to="/deployments"
                :class="[isActive('/deployments') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700', 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium']">
                Deployments
              </NuxtLink>
              <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin/users"
                :class="[isActive('/admin/users') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700', 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium']">
                Users
              </NuxtLink>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="-mr-2 flex items-center sm:hidden">
            <button @click="mobileMenuOpen = !mobileMenuOpen" type="button"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu" :aria-expanded="mobileMenuOpen">
              <span class="sr-only">Open main menu</span>
              <!-- Icon when menu is closed -->
              <svg :class="{ 'hidden': mobileMenuOpen, 'block': !mobileMenuOpen }" class="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <!-- Icon when menu is open -->
              <svg :class="{ 'block': mobileMenuOpen, 'hidden': !mobileMenuOpen }" class="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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

      <!-- Mobile menu, show/hide based on menu state -->
      <div class="sm:hidden" id="mobile-menu" v-show="mobileMenuOpen">
        <div class="pt-2 pb-3 space-y-1" v-if="isAuthenticated">
          <NuxtLink to="/dashboard"
            :class="[isActive('/dashboard') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800', 'block pl-3 pr-4 py-2 border-l-4 text-base font-medium']">
            Dashboard
          </NuxtLink>
          <NuxtLink to="/projects"
            :class="[isActive('/projects') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800', 'block pl-3 pr-4 py-2 border-l-4 text-base font-medium']">
            Projects
          </NuxtLink>
          <NuxtLink to="/deployments"
            :class="[isActive('/deployments') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800', 'block pl-3 pr-4 py-2 border-l-4 text-base font-medium']">
            Deployments
          </NuxtLink>
          <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin/users"
            :class="[isActive('/admin/users') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800', 'block pl-3 pr-4 py-2 border-l-4 text-base font-medium']">
            Users
          </NuxtLink>
        </div>
        <div class="pt-4 pb-3 border-t border-gray-200">
          <div class="flex items-center px-4" v-if="isAuthenticated">
            <div class="ml-3">
              <div class="text-base font-medium text-gray-800">{{ user?.email }}</div>
            </div>
          </div>
          <div class="mt-3 space-y-1" v-if="isAuthenticated">
            <button @click="logout"
              class="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-gray-100">
              Logout
            </button>
          </div>
          <div class="mt-3 space-y-1" v-else>
            <NuxtLink to="/auth/login"
              class="block px-4 py-2 text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-gray-100">
              Login
            </NuxtLink>
            <NuxtLink to="/auth/register"
              class="block px-4 py-2 text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-gray-100">
              Register
            </NuxtLink>
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
import ToastContainer from '~/components/Toast/ToastContainer.vue';

const route = useRoute();
const { user, isAuthenticated, logout, initAuth } = useAuth();

const mobileMenuOpen = ref(false);

onMounted(() => {
  initAuth();
});

const isActive = (path) => {
  return route.path === path || (path !== '/' && route.path.startsWith(path));
};
</script>