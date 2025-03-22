<template>
  <div class="bg-white shadow-md rounded-lg p-6">
    <h2 class="text-2xl font-bold mb-6">User Management</h2>
    
    <!-- Create User Form -->
    <div class="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
      <h3 class="text-lg font-semibold mb-4">Create New User</h3>
      <form @submit.prevent="createUser" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="newUser.email" 
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="newUser.password" 
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="flex justify-end">
          <button 
            type="submit" 
            :disabled="isLoading"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ isLoading ? 'Creating...' : 'Create User' }}
          </button>
        </div>
      </form>
      <div v-if="error" class="mt-4 text-red-500 text-sm">{{ error }}</div>
      <div v-if="successMessage" class="mt-4 text-green-500 text-sm">{{ successMessage }}</div>
    </div>
    
    <!-- User List -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Users</h3>
      <div v-if="loadingUsers" class="text-center py-4">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-500">Loading users...</p>
      </div>
      <div v-else-if="users.length === 0" class="text-center py-4 text-gray-500">
        No users found.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in users" :key="user.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ user.email }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span 
                  :class="{
                    'px-2 py-1 text-xs font-semibold rounded-full': true,
                    'bg-purple-100 text-purple-800': user.role === 'ADMIN',
                    'bg-blue-100 text-blue-800': user.role === 'USER'
                  }"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(user.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';

const api = useApi();
const users = ref([]);
const loadingUsers = ref(true);
const isLoading = ref(false);
const error = ref('');
const successMessage = ref('');

const newUser = ref({
  email: '',
  password: ''
});

const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const response = await api.get('/users');
    users.value = response;
  } catch (err) {
    console.error('Error fetching users:', err);
    error.value = 'Failed to load users';
  } finally {
    loadingUsers.value = false;
  }
};

const createUser = async () => {
  error.value = '';
  successMessage.value = '';
  isLoading.value = true;
  
  try {
    await api.post('/users', newUser.value);
    successMessage.value = 'User created successfully';
    newUser.value = { email: '', password: '' };
    await fetchUsers(); // Refresh the user list
  } catch (err) {
    console.error('Error creating user:', err);
    error.value = err.data?.message || 'Failed to create user';
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

onMounted(() => {
  fetchUsers();
});
</script>