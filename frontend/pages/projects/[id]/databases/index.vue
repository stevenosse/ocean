<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Managed Databases</h1>
        <p class="mt-1 text-sm text-gray-500">Create and manage PostgreSQL databases for your project.</p>
      </div>
      <div class="flex space-x-3">
        <button @click="showCreateDatabaseModal = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
          <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Database
        </button>
        <NuxtLink :to="`/projects/${$route.params.id}`"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm">
          <svg class="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to Project
        </NuxtLink>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-10">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-500">Loading databases...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="databases.length === 0"
      class="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100 p-8 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No databases</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new database.</p>
      <div class="mt-6">
        <button @click="showCreateDatabaseModal = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
          <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Database
        </button>
      </div>
    </div>

    <!-- Database List Section -->
    <div v-else-if="databases.length > 0"
      class="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100 mb-8">
      <div class="px-6 py-5 border-b border-gray-200">
        <h3 class="text-lg leading-6 font-medium text-gray-900 flex items-center justify-between">
          <span>Your Databases</span>
          <button @click="showCreateDatabaseModal = true"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
            <svg class="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Database
          </button>
        </h3>
        <p class="mt-1 text-sm text-gray-500">Manage your PostgreSQL databases and their backups.</p>
      </div>

      <div class="divide-y divide-gray-200">
        <div v-for="database in databases" :key="database.id" class="p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-xl font-semibold text-gray-800">{{ database.name }}</h2>
              <div class="flex items-center space-x-4 mt-1">
                <p class="text-sm text-gray-500">
                  <span class="inline-flex items-center">
                    <svg class="mr-1 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                    {{ database.host }}:{{ database.port }}
                  </span>
                </p>
                <p class="text-sm">
                  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          database.status === 'running' ? 'bg-green-100 text-green-800' :
            database.status === 'stopped' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800']">
                    {{ database.status }}
                  </span>
                </p>
              </div>
            </div>
            <div class="flex space-x-2">
              <button @click="showConnectionDetails(database)"
                class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
                title="View Connection Details">
                <svg class="-ml-0.5 mr-1.5 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Connection
              </button>
              <button @click="createBackup(database.id)"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm"
                title="Create Backup" :disabled="backupInProgress">
                <svg class="-ml-0.5 mr-1.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Backup
              </button>
              <button @click="confirmDeleteDatabase(database)"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm"
                title="Delete Database">
                <svg class="-ml-0.5 mr-1.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>

          <!-- Database Backups -->
          <div class="mt-6 border-t pt-6">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-md font-medium text-gray-700">Database Backups</h3>
              <button @click="loadBackups(database.id)"
                class="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm focus:outline-none transition-colors duration-200">
                <svg class="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Backups
              </button>
            </div>

            <!-- Loading state for backups -->
            <div v-if="backupsLoading[database.id]" class="text-center py-4">
              <div class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p class="mt-1 text-sm text-gray-500">Loading backups...</p>
            </div>

            <!-- Empty state for backups -->
            <div v-else-if="!backups[database.id] || backups[database.id].length === 0"
              class="bg-gray-50 rounded-md p-4 text-center">
              <p class="text-sm text-gray-500">No backups available for this database.</p>
              <button @click="createBackup(database.id)" :disabled="backupInProgress"
                class="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="-ml-0.5 mr-1.5 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Create First Backup
              </button>
            </div>

            <!-- Backups list -->
            <div v-else class="space-y-2">
              <DatabaseBackups :backups="backups[database.id] || []" :loading="backupsLoading[database.id] || false"
                :database-id="database.id" @restore-backup="(backup) => confirmRestoreBackup(backup, database)"
                @delete-backup="confirmDeleteBackup" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateDatabaseModal :show="showCreateDatabaseModal" :is-creating="isCreatingDatabase"
      :initial-value="{ name: '', projectId: projectId }" :error="databaseError"
      @close="!isCreatingDatabase && (showCreateDatabaseModal = false)" @submit="handleDatabaseCreated" />

    <!-- Connection Details Modal -->
    <ConnectionDetailsModal :show="showConnectionModal" :database="selectedDatabase"
      :connection-string="connectionString" :show-password="showPassword" :copied="copied"
      :is-loading="isLoadingConnectionString" @close="showConnectionModal = false"
      @toggle-password="showPassword = !showPassword" @copy="copyConnectionString" />



    <!-- Delete Database Confirmation Modal -->
    <ConfirmationModal :show="showDeleteDatabaseModal" title="Delete Database"
      :message="`Are you sure you want to delete the database '${selectedDatabase?.name || ''}'? This action cannot be undone and all data will be permanently lost.`"
      button-text="Delete" button-class="bg-red-600 hover:bg-red-700" :in-progress="isDeletingDatabase"
      @close="!isDeletingDatabase && (showDeleteDatabaseModal = false)"
      @confirm="() => selectedDatabase ? deleteDatabase(selectedDatabase.id) : null" />

    <!-- Restore Backup Confirmation Modal -->
    <ConfirmationModal :show="showRestoreBackupModal" title="Restore Backup"
      :message="`Are you sure you want to restore the database '${selectedDatabase?.name || ''}' from the backup created on ${selectedBackup ? formatDate(selectedBackup.createdAt) : ''}? This will overwrite all current data in the database.`"
      button-text="Restore" button-class="bg-blue-600 hover:bg-blue-700" :in-progress="isRestoringBackup"
      @close="!isRestoringBackup && (showRestoreBackupModal = false)"
      @confirm="() => selectedBackup ? restoreBackup(selectedBackup.id) : null" />

    <!-- Delete Backup Confirmation Modal -->
    <ConfirmationModal :show="showDeleteBackupModal" title="Delete Backup"
      :message="`Are you sure you want to delete this backup${selectedBackup ? ' created on ' + formatDate(selectedBackup.createdAt) : ''}? This action cannot be undone.`"
      button-text="Delete" button-class="bg-red-600 hover:bg-red-700" :in-progress="isDeletingBackup"
      @close="!isDeletingBackup && (showDeleteBackupModal = false)" @confirm="() => deleteBackup(selectedBackup)" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { useDatabaseApi } from '~/composables/useDatabaseApi';
import type { ManagedDatabase, DatabaseBackup, CreateDatabaseDto } from '~/types';
import CreateDatabaseModal from '~/components/Database/CreateDatabaseModal.vue';
import ConnectionDetailsModal from '~/components/Database/ConnectionDetailsModal.vue';
import ConfirmationModal from '~/components/Database/ConfirmationModal.vue';

const route = useRoute();
const toast = useToast();
const databaseApi = useDatabaseApi();

const projectId = computed(() => Number(route.params.id));
const databases = ref<ManagedDatabase[]>([]);
const loading = ref(true);
const backups = ref<Record<number, DatabaseBackup[]>>({});
const backupsLoading = ref<Record<number, boolean>>({});
const backupInProgress = ref(false);

const showCreateDatabaseModal = ref(false);
const showConnectionModal = ref(false);
const showDeleteDatabaseModal = ref(false);
const showRestoreBackupModal = ref(false);
const showDeleteBackupModal = ref(false);

const isCreatingDatabase = ref(false);
const isDeletingDatabase = ref(false);
const isRestoringBackup = ref(false);
const isDeletingBackup = ref(false);
const isLoadingConnectionString = ref(false);

const showPassword = ref(false);
const copied = ref(false);
const connectionString = ref('');

const selectedDatabase = ref<ManagedDatabase | null>(null);
const selectedBackup = ref<DatabaseBackup | null>(null);

const loadDatabases = async () => {
  loading.value = true;
  try {
    const data = await databaseApi.getDatabases(projectId.value);
    databases.value = data;

    databases.value.forEach(db => {
      if (db.backups && db.backups.length > 0) {
        if (!backups.value[db.id]) {
          backups.value[db.id] = [];
        }
        backups.value[db.id] = [db.backups[0]];
      }
    });
  } catch (error) {
    console.error('Failed to load databases:', error);
    toast.error('Failed to load databases');
  } finally {
    loading.value = false;
  }
};

const loadBackups = async (databaseId: number) => {
  backupsLoading.value[databaseId] = true;
  try {
    const data = await databaseApi.getBackups(databaseId);
    if (data) {
      backups.value[databaseId] = data;
    } else {
      backups.value[databaseId] = [];
      toast.error('No backups found or server returned empty response');
    }
  } catch (error: any) {
    console.error(`Failed to load backups for database ${databaseId}:`, error);
    toast.error(`Failed to load backups: ${error?.message || 'Unknown error'}`);
    backups.value[databaseId] = [];
  } finally {
    backupsLoading.value[databaseId] = false;
  }
};

const databaseError = ref<string | undefined>(undefined);
const handleDatabaseCreated = async (database: CreateDatabaseDto) => {
  isCreatingDatabase.value = true;
  databaseError.value = undefined;
  try {
    const newDatabase = await databaseApi.createDatabase(database);
    if (newDatabase) {
      showCreateDatabaseModal.value = false;
      await loadDatabases();
      toast.success(`Database ${newDatabase.name} created successfully`);
    } else {
      const errorMessage = 'Failed to create database.';
      toast.error(errorMessage);
      databaseError.value = errorMessage;
    }
  } catch (error: any) {
    console.error('Error creating database:', error);
    const errorMessage = `Failed to create database: ${error?.message || 'Unknown error'}`;
    toast.error(errorMessage);
    databaseError.value = errorMessage;
  } finally {
    isCreatingDatabase.value = false;
  }
};

const createBackup = async (databaseId: number) => {
  backupInProgress.value = true;
  try {
    const data = await databaseApi.createBackup(databaseId);

    if (data) {
      if (!backups.value[databaseId]) {
        backups.value[databaseId] = [];
      }

      backups.value[databaseId].unshift(data);

      toast.success('Backup created successfully');
    } else {
      toast.error('Failed to create backup.');
    }
  } catch (error: any) {
    console.error('Failed to create backup:', error);
    toast.error(`Failed to create backup: ${error?.message || 'Unknown error'}`);
  } finally {
    backupInProgress.value = false;
  }
};

const showConnectionDetails = async (database: ManagedDatabase) => {
  selectedDatabase.value = database;
  showConnectionModal.value = true;
  showPassword.value = false;
  copied.value = false;
  isLoadingConnectionString.value = true;

  connectionString.value = `postgresql://${database.username}:********@${database.host}:${database.port}/${database.name}`;

  try {
    const data = await databaseApi.getDatabaseConnectionString(database.id);
    if (data && data.connectionString) {
      connectionString.value = data.connectionString;
    } else {
      toast.warning('Using default connection string format. Actual credentials may differ.');
    }
  } catch (error: any) {
    console.error('Failed to get connection string:', error);
    toast.error(`Failed to get connection string: ${error?.message || 'Unknown error'}`);
  } finally {
    isLoadingConnectionString.value = false;
  }
};

const copyConnectionString = () => {
  if (!connectionString.value) {
    toast.error('No connection string available to copy');
    return;
  }

  navigator.clipboard.writeText(connectionString.value)
    .then(() => {
      copied.value = true;
      toast.success('Connection string copied to clipboard');
      setTimeout(() => {
        copied.value = false;
      }, 3000);
    })
    .catch(err => {
      console.error('Failed to copy connection string:', err);
      toast.error(`Failed to copy to clipboard: ${err?.message || 'Unknown error'}`);
    });
};

const confirmDeleteDatabase = (database: ManagedDatabase) => {
  selectedDatabase.value = database;
  showDeleteDatabaseModal.value = true;
};

const deleteDatabase = async (databaseId: number) => {
  isDeletingDatabase.value = true;
  try {
    const success = await databaseApi.deleteDatabase(databaseId);
    if (success) {
      databases.value = databases.value.filter(db => db.id !== databaseId);
      delete backups.value[databaseId];
      showDeleteDatabaseModal.value = false;
      toast.success('Database deleted successfully');
    } else {
      toast.error('Failed to delete database: Server returned unsuccessful status');
      showDeleteDatabaseModal.value = false;
    }
  } catch (error: any) {
    console.error('Failed to delete database:', error);
    toast.error(`Failed to delete database: ${error?.message || 'Unknown error'}`);
    showDeleteDatabaseModal.value = false;
  } finally {
    isDeletingDatabase.value = false;
  }
};

const confirmRestoreBackup = (backup: DatabaseBackup, database: ManagedDatabase) => {
  selectedBackup.value = backup;
  selectedDatabase.value = database;
  showRestoreBackupModal.value = true;
};

const restoreBackup = async (backupId: number) => {
  isRestoringBackup.value = true;
  try {
    const success = await databaseApi.restoreBackup(backupId);
    if (success) {
      showRestoreBackupModal.value = false;
      toast.success('Backup restored successfully');
      await loadDatabases();
    } else {
      toast.error('Failed to restore backup: Server returned unsuccessful status');
      showRestoreBackupModal.value = false;
    }
  } catch (error: any) {
    console.error('Failed to restore backup:', error);
    toast.error(`Failed to restore backup: ${error?.message || 'Unknown error'}`);
    showRestoreBackupModal.value = false;
  } finally {
    isRestoringBackup.value = false;
  }
};

const confirmDeleteBackup = (backup: DatabaseBackup) => {
  selectedBackup.value = backup;
  showDeleteBackupModal.value = true;
};

const deleteBackup = async (backup: DatabaseBackup | null) => {
  try {
    if (!backup) {
      toast.error('No backup selected');
      showDeleteBackupModal.value = false;
      return;
    }

    isDeletingBackup.value = true;
    const success = await databaseApi.deleteBackup(backup.id);
    if (success) {
      if (backups.value[backup.databaseId]) {
        backups.value[backup.databaseId] = backups.value[backup.databaseId].filter(b => b.id !== backup.id);
      }

      showDeleteBackupModal.value = false;
      toast.success('Backup deleted successfully');
    } else {
      toast.error('Failed to delete backup: Server returned unsuccessful status');
      showDeleteBackupModal.value = false;
    }
  } catch (error: any) {
    console.error('Failed to delete backup:', error);
    toast.error(`Failed to delete backup: ${error?.message || 'Unknown error'}`);
    showDeleteBackupModal.value = false;
  } finally {
    isDeletingBackup.value = false;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

onMounted(() => {
  loadDatabases();
});
</script>