<template>
  <div>
    <!-- This page will redirect to dashboard -->
  </div>
</template>

<script lang="ts" setup>
import { useAuth } from '~/composables/useAuth';

onMounted(() => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated.value) {
    router.push('/dashboard');
  } else {
    router.push('/auth/login');
  }
});

</script>