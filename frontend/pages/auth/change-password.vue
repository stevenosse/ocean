<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Change Your Password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          You need to change your password before continuing
        </p>
      </div>

      <!-- Use the PasswordChangeModal component with isForced=true -->
      <PasswordChangeModal 
        :is-open="true" 
        :is-forced="true" 
        @password-changed="handlePasswordChanged" 
      />
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '~/composables/useAuth';

const { user } = useAuth();
const router = useRouter();

definePageMeta({
  layout: 'auth'
});

const handlePasswordChanged = (updatedUser) => {
  if (user.value) {
    user.value.forcePasswordChange = false;
  }
  
  router.push('/dashboard');
};
</script>