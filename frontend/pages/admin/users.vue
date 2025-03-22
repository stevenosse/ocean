<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold">User Management</h1>
      <p class="text-gray-600 mt-2">Manage users and their access to the platform</p>
    </div>

    <UserManagement />
  </div>
</template>

<script setup>
import { useAuth } from '~/composables/useAuth';
import { useRouter } from 'vue-router';

const { user, isAuthenticated } = useAuth();
const router = useRouter();

onMounted(() => {
  if (!isAuthenticated.value || user.value?.role !== 'ADMIN') {
    router.push('/dashboard');
  }
});
</script>