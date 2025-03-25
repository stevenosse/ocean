<template>
  <div>
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Users</h1>
        <p class="text-gray-600 mt-2">Manage users and their access to the platform</p>
      </div>
      <button @click="showUserCreationModal = true"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        <svg class="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>New user</span>
      </button>
    </div>

    <!-- Filter and View Controls -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <!-- Search Input -->
        <div class="relative w-full sm:w-64">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input v-model="searchQuery" type="text" placeholder="Search users..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>

        <!-- Role Filter -->
        <select v-model="roleFilter"
          class="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
        <!-- Sort Options -->
        <select v-model="sortOption"
          class="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
          <option value="email-asc">Email (A-Z)</option>
          <option value="email-desc">Email (Z-A)</option>
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
        </select>

        <!-- View Toggle -->
        <div class="inline-flex rounded-md shadow-sm">
          <button @click="viewMode = ViewMode.Grid" :class="{
            'px-4 py-2 text-sm font-medium rounded-l-md border': true,
            'bg-blue-50 text-blue-700 border-blue-500': viewMode === 'grid',
            'bg-white text-gray-700 border-gray-300 hover:bg-gray-50': viewMode !== 'grid'
          }">
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button @click="viewMode = ViewMode.List" :class="{
            'px-4 py-2 text-sm font-medium rounded-r-md border': true,
            'bg-blue-50 text-blue-700 border-blue-500': viewMode === 'list',
            'bg-white text-gray-700 border-gray-300 hover:bg-gray-50': viewMode !== 'list'
          }">
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-10">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-500">Loading users...</p>
    </div>

    <!-- Empty State - No Users At All -->
    <div v-else-if="users.length === 0" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">No users</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
        <div class="mt-6">
          <button @click="showUserCreationModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create a user</span>
          </button>
        </div>
      </div>
    </div>

    <!-- No Results After Filtering -->
    <div v-else-if="filteredUsers.length === 0" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">No matching users</h3>
        <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
        <div class="mt-6">
          <button @click="resetFilters"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset filters</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Users Grid View -->
    <div v-else-if="viewMode === 'grid' && filteredUsers.length > 0"
      class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="user in filteredUsers" :key="user.id"
        class="bg-white shadow-md rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full w-full">
        <!-- Card Header with Role Badge -->
        <div class="px-5 pt-5 pb-3 flex justify-between items-start">
          <div class="text-lg font-semibold text-blue-600">
            {{ user.email }}
          </div>
          <span :class="{
            'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full': true,
            'bg-purple-100 text-purple-800': user.role === 'ADMIN',
            'bg-blue-100 text-blue-800': user.role === 'USER'
          }">
            {{ user.role }}
          </span>
        </div>

        <!-- Card Body -->
        <div class="px-5 pb-4 flex-grow flex flex-col">
          <!-- User ID -->
          <div class="text-sm text-gray-500 flex items-start mb-2">
            <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 mt-0.5" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            <span class="inline-block w-full">ID: {{ user.id }}</span>
          </div>

          <!-- Created At -->
          <div class="text-sm text-gray-500 flex items-start mb-2">
            <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 mt-0.5" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="inline-block w-full">Created: {{ formatDate(user.createdAt) }}</span>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="border-t border-gray-200 px-5 py-4 flex justify-end items-center space-x-2">
          <button @click="toggleRoleEdit(user)"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
            Edit Role
          </button>
          <button @click="confirmDeleteUser(user)"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200">
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Users List View -->
    <div v-else-if="viewMode === 'list' && filteredUsers.length > 0"
      class="bg-white shadow overflow-hidden sm:rounded-lg">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID</th>
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
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(user.createdAt) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
              <button @click="toggleRoleEdit(user)" class="text-indigo-600 hover:text-indigo-900">Edit Role</button>
              <button @click="confirmDeleteUser(user)" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
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

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useRouter } from 'vue-router';
import ConfirmationModal from '~/components/ConfirmationModal.vue';
import UserCreationModal from '~/components/UserCreationModal.vue';
import { User } from '~/types';
import { useUsers } from '~/composables/useUsers';

enum ViewMode {
  Grid = 'grid',
  List = 'list',
}

const { fetchUsers: apiFetchUsers, updateUserRole: apiUpdateUserRole, deleteUser: apiDeleteUser } = useUsers()
const toast = useToast();
const router = useRouter();
const { user: currentUser, isAuthenticated, initAuth } = useAuth();

onMounted(async () => {
  await initAuth();
  if (!isAuthenticated.value || currentUser.value?.role !== 'ADMIN') {
    router.push('/dashboard');
  }
  fetchUsers();
});

const users = ref<User[]>([]);
const filteredUsers = ref<User[]>([]);
const loading = ref(true);

const searchQuery = ref('');
const roleFilter = ref('');
const sortOption = ref('email-asc');
const viewMode = ref(ViewMode.Grid);

const showUserCreationModal = ref(false);
const showRoleEditModal = ref(false);
const selectedUser = ref<User | null>(null);
const selectedRole = ref('');
const isUpdatingRole = ref(false);

const showDeleteModal = ref(false);
const isDeletingUser = ref(false);

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await apiFetchUsers();
    users.value = response;
    applyFilters();
  } catch (err) {
    console.error('Error fetching users:', err);
    toast.error('Error', 'Failed to load users');
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  if (!users.value) return;

  filteredUsers.value = users.value.filter(user => {
    const matchesSearch = !searchQuery.value ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesRole = !roleFilter.value || user.role === roleFilter.value;

    return matchesSearch && matchesRole;
  });

  filteredUsers.value.sort((a: User, b: User) => {
    switch (sortOption.value) {
      case 'email-asc':
        return a.email.localeCompare(b.email);
      case 'email-desc':
        return b.email.localeCompare(a.email);
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default:
        return 0;
    }
  });
};

watch([searchQuery, roleFilter, sortOption], () => {
  applyFilters();
});

const resetFilters = () => {
  searchQuery.value = '';
  roleFilter.value = '';
  sortOption.value = 'email-asc';
  applyFilters();
};

const toggleRoleEdit = (user: User) => {
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
  try {
    await apiUpdateUserRole(selectedUser.value.id, selectedRole.value);

    const userIndex = users.value.findIndex(u => u.id === selectedUser.value?.id);
    if (userIndex !== -1) {
      users.value[userIndex].role = selectedRole.value;
    }

    toast.success('Success', 'User role updated successfully');
    closeRoleEditModal();
    applyFilters();
  } catch (err) {
    console.error('Error updating user role:', err);
    toast.error('Error', 'Failed to update user role');
  } finally {
    isUpdatingRole.value = false;
  }
};

const confirmDeleteUser = (user: User) => {
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
  try {
    const response = await apiDeleteUser(selectedUser.value.id);
    if (response) {
      users.value = users.value.filter((u: User) => u.id !== selectedUser.value?.id);
      applyFilters();
      toast.success('Success', 'User deleted successfully');
    }

    closeDeleteModal();
  } finally {
    isDeletingUser.value = false;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};
</script>