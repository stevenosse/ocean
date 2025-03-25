<template>
  <div class="bg-white shadow-md rounded-lg p-6">
    <h2 class="text-2xl font-bold mb-6">User Management</h2>

    <!-- Create User Button -->
    <div class="mb-8">
      <button @click="showUserCreationModal = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        Create New User
      </button>
    </div>

    <!-- User List -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Users</h3>
        <div class="flex space-x-2">
          <div class="relative">
            <input type="text" v-model="searchQuery" placeholder="Search users..."
              class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              @input="filterUsers" />
            <button v-if="searchQuery" @click="clearSearch"
              class="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <select v-model="roleFilter"
            class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            @change="filterUsers">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>
        </div>
      </div>

      <div v-if="loadingUsers" class="text-center py-4">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-500">Loading users...</p>
      </div>
      <div v-else-if="filteredUsers.length === 0" class="text-center py-4 text-gray-500">
        No users found.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ user.email }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex items-center">
                  <span :class="{
                    'px-2 py-1 text-xs font-semibold rounded-full': true,
                    'bg-purple-100 text-purple-800': user.role === 'ADMIN',
                    'bg-blue-100 text-blue-800': user.role === 'USER'
                  }">
                    {{ user.role }}
                  </span>
                  <button @click="toggleRoleEdit(user)" class="ml-2 text-gray-400 hover:text-blue-600"
                    title="Edit Role">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(user.createdAt) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex space-x-2">
                  <button @click="confirmDeleteUser(user)" class="text-red-600 hover:text-red-900" title="Delete User">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Role Edit Modal -->
  <div v-if="showRoleEditModal" class="fixed inset-0 z-10 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 transition-opacity" @click="closeRoleEditModal">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div
              class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <!-- Edit icon -->
              <svg class="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828l-11.414 11.414a1 1 0 01-1.414 0l-3.85-3.85a1 1 0 01-.293-.707v-2.828a1 1 0 01.293-.707l11.414-11.414z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Edit User Role</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">Change the role for user: <span class="font-medium">{{
                    selectedUser?.email }}</span></p>
              </div>
              <div class="mt-4">
                <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
                <select id="role" v-model="selectedRole"
                  class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button @click="updateUserRole" :disabled="isUpdatingRole"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
            {{ isUpdatingRole ? 'Updating...' : 'Update Role' }}
          </button>
          <button @click="closeRoleEditModal"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <ConfirmationModal :is-open="showDeleteModal" title="Delete User"
    :message="`Are you sure you want to delete user ${selectedUser?.email}? This action cannot be undone.`"
    confirm-button-text="Delete" @confirm="deleteUser" @close="closeDeleteModal" />

  <!-- User Creation Modal -->
  <UserCreationModal :is-open="showUserCreationModal" @close="showUserCreationModal = false" @created="fetchUsers" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '~/composables/useToast';
import ConfirmationModal from '~/components/ConfirmationModal.vue';
import UserCreationModal from '~/components/UserCreationModal.vue';
import { useUsers } from '~/composables/useUsers';

const toast = useToast();
const users = ref([]);
const filteredUsers = ref([]);
const loadingUsers = ref(true);
const error = ref('');


const searchQuery = ref('');
const roleFilter = ref('');
const { updateUserRole: apiUpdateUserRole, deleteUser: apiDeleteUser, fetchUsers: apiFetchUsers } = useUsers();

const showUserCreationModal = ref(false);

const showRoleEditModal = ref(false);
const selectedUser = ref(null);
const selectedRole = ref('');
const isUpdatingRole = ref(false);

const showDeleteModal = ref(false);
const isDeletingUser = ref(false);

const fetchUsers = async () => {
  loadingUsers.value = true;
  const response = await apiFetchUsers();
  users.value = response;
  filterUsers();
  loadingUsers.value = false;
};

const filterUsers = () => {
  if (!users.value) return;

  filteredUsers.value = users.value.filter(user => {
    const matchesSearch = !searchQuery.value ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesRole = !roleFilter.value || user.role === roleFilter.value;

    return matchesSearch && matchesRole;
  });
};

const clearSearch = () => {
  searchQuery.value = '';
  filterUsers();
};

const toggleRoleEdit = (user) => {
  selectedUser.value = user;
  selectedRole.value = user.role;
  showRoleEditModal.value = true;
};

const closeRoleEditModal = () => {
  showRoleEditModal.value = false;
  selectedUser.value = null;
};

const updateUserRole = async () => {
  if (!selectedUser.value) return;

  isUpdatingRole.value = true;
  const result = await apiUpdateUserRole(selectedUser.value.id, selectedRole.value);
  
  if (result) {
    const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id);
    if (userIndex !== -1) {
      users.value[userIndex].role = selectedRole.value;
    }

    toast.success('User role updated successfully');
    closeRoleEditModal();
    filterUsers();
  }
  
  isUpdatingRole.value = false;
};

const confirmDeleteUser = (user) => {
  selectedUser.value = user;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedUser.value = null;
};

const deleteUser = async () => {
  if (!selectedUser.value) return;

  isDeletingUser.value = true;
  const result = await apiDeleteUser(selectedUser.value.id);
  
  if (result) {
    users.value = users.value.filter(u => u.id !== selectedUser.value.id);
    filterUsers();

    toast.success('User deleted successfully');
    closeDeleteModal();
  }
  
  isDeletingUser.value = false;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

onMounted(() => {
  fetchUsers();
});
</script>