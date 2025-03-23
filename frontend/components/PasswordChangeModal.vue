<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div
              class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10"
            >
              <svg
                class="h-6 w-6 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Change Your Password</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  {{ isForced ? 'You must change your password before continuing.' : 'Please enter your current password and a new password.' }}
                </p>
              </div>

              <form @submit.prevent="handleSubmit" class="mt-4 space-y-4">
                <div v-if="error" class="p-2 text-sm text-red-600 bg-red-50 rounded">
                  {{ error }}
                </div>

                <div>
                  <label for="currentPassword" class="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    id="currentPassword"
                    v-model="form.currentPassword"
                    type="password"
                    required
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="newPassword" class="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    id="newPassword"
                    v-model="form.newPassword"
                    type="password"
                    required
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters and include uppercase, lowercase, and numbers.
                  </p>
                </div>

                <div>
                  <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    v-model="form.confirmPassword"
                    type="password"
                    required
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            @click="handleSubmit"
            :disabled="isLoading"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            <span v-if="isLoading">Changing...</span>
            <span v-else>Change Password</span>
          </button>
          <button
            v-if="!isForced"
            type="button"
            @click="close"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  isForced: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'password-changed']);

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const { changePassword, error, isLoading } = useAuth();

const handleSubmit = async () => {
  if (form.value.newPassword !== form.value.confirmPassword) {
    error.value = 'New passwords do not match';
    return;
  }
  
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/;
  if (!passwordRegex.test(form.value.newPassword) || form.value.newPassword.length < 8) {
    error.value = 'Password must be at least 8 characters and include uppercase, lowercase, and numbers';
    return;
  }
  
  const success = await changePassword(form.value.currentPassword, form.value.newPassword);
  
  if (success) {
    form.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    emit('password-changed');
    
    if (!props.isForced) {
      close();
    }
  }
};

const close = () => {
  emit('close');
};
</script>