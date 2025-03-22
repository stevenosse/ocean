<template>
  <div>
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Projects</h1>
      <NuxtLink to="/projects/new"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        <svg class="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>New Project</span>
      </NuxtLink>
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
          <input v-model="searchQuery" type="text" placeholder="Search projects..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>

        <!-- Status Filter -->
        <select v-model="statusFilter"
          class="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
        <!-- Sort Options -->
        <select v-model="sortOption"
          class="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
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
      <p class="mt-2 text-gray-500">Loading projects...</p>
    </div>

    <!-- Empty State - No Projects At All -->
    <div v-else-if="projects.length === 0" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">No projects</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
        <div class="mt-6">
          <NuxtLink to="/projects/new"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create a project</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- No Results After Filtering -->
    <div v-else-if="filteredProjects.length === 0" class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">No matching projects</h3>
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

    <!-- Projects Grid View -->
    <div v-else-if="viewMode === 'grid' && filteredProjects.length > 0"
      class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="project in filteredProjects" :key="project.id"
        class="bg-white shadow-md rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full w-full">
        <!-- Card Header with Status Badge -->
        <div class="px-5 pt-5 pb-3 flex justify-between items-start">
          <div class="text-lg font-semibold text-blue-600">
            <NuxtLink :to="`/projects/${project.id}`" class="hover:underline">
              {{ project.name }}
            </NuxtLink>
          </div>
          <span :class="{
            'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full': true,
            'bg-green-100 text-green-800': project.active,
            'bg-red-100 text-red-800': !project.active
          }">
            {{ project.active ? 'Active' : 'Inactive' }}
          </span>
        </div>

        <!-- Card Body -->
        <div class="px-5 pb-4 flex-grow flex flex-col">
          <!-- Repository URL -->
          <div class="text-sm text-gray-500 flex items-start mb-2">
            <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 mt-0.5" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <a :href="project.repositoryUrl" target="_blank" rel="noopener noreferrer"
              class="hover:underline truncate w-full overflow-hidden text-ellipsis inline-block">
              {{ project.repositoryUrl }}
            </a>
          </div>

          <!-- Branch -->
          <div class="text-sm text-gray-500 flex items-start mb-2">
            <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 mt-0.5" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span class="inline-block w-full">{{ project.branch || 'default branch' }}</span>
          </div>

          <!-- Application URL if available -->
          <div v-if="project.applicationUrl" class="text-sm text-gray-500 flex items-start mb-2">
            <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 mt-0.5" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <a :href="project.applicationUrl" target="_blank" rel="noopener noreferrer"
              class="hover:underline truncate text-blue-500 inline-block w-full">
              {{ project.applicationUrl }}
            </a>
          </div>

          <!-- Last Deployment Status if available -->
          <div v-if="projectDeployments[project.id]" class="mt-auto pt-3 border-t border-gray-100">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500">Last deployment:</span>
              <span :class="{
            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
            'bg-green-100 text-green-800': projectDeployments[project.id].status === 'completed',
            'bg-yellow-100 text-yellow-800': projectDeployments[project.id].status === 'pending' || projectDeployments[project.id].status === 'in_progress',
            'bg-red-100 text-red-800': projectDeployments[project.id].status === 'failed'
          }">
                {{ projectDeployments[project.id].status }}
              </span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ new Date(projectDeployments[project.id].startedAt).toLocaleString() }}
            </div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="border-t border-gray-200 px-5 py-4 flex justify-between items-center">
          <div>
            <span class="text-xs text-gray-500">Created: {{ new Date(project.createdAt).toLocaleDateString() }}</span>
          </div>
          <div class="flex space-x-2">
            <NuxtLink :to="`/projects/${project.id}`"
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
              View
            </NuxtLink>
            <button v-if="project.active" @click="triggerDeploy(project.id)"
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200">
              Deploy
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Projects List View -->
    <div v-else-if="viewMode === 'list' && filteredProjects.length > 0"
      class="bg-white shadow overflow-hidden sm:rounded-lg">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Repository</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Branch</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="project in filteredProjects" :key="project.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-blue-600 text-white">
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <NuxtLink :to="`/projects/${project.id}`" class="text-blue-600 hover:text-blue-900">
                    {{ project.name }}
                  </NuxtLink>
                  <div v-if="project.applicationUrl" class="text-xs text-gray-500">
                    <a :href="project.applicationUrl" target="_blank" class="hover:underline text-blue-500">
                      {{ project.applicationUrl }}
                    </a>
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span :class="{
            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
            'bg-green-100 text-green-800': project.active,
            'bg-red-100 text-red-800': !project.active
          }">
                {{ project.active ? 'Active' : 'Inactive' }}
              </span>
              <div v-if="projectDeployments[project.id]" class="mt-1">
                <span :class="{
            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
            'bg-green-100 text-green-800': projectDeployments[project.id].status === 'completed',
            'bg-yellow-100 text-yellow-800': projectDeployments[project.id].status === 'pending' || projectDeployments[project.id].status === 'in_progress',
            'bg-red-100 text-red-800': projectDeployments[project.id].status === 'failed'
          }">
                  Last: {{ projectDeployments[project.id].status }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
              <a :href="project.repositoryUrl" target="_blank" class="hover:underline">
                {{ project.repositoryUrl }}
              </a>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ project.branch || 'default branch' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ new Date(project.createdAt).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
              <NuxtLink :to="`/projects/${project.id}`" class="text-blue-600 hover:text-blue-900">View</NuxtLink>
              <NuxtLink :to="`/projects/${project.id}/edit`" class="text-indigo-600 hover:text-indigo-900">Edit
              </NuxtLink>
              <button v-if="project.active" @click="triggerDeploy(project.id)"
                class="text-green-600 hover:text-green-900">
                Deploy
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import type { Project, Deployment } from '~/types'
import { useToast } from '~/composables/useToast'

enum ViewMode {
  Grid = 'grid',
  List = 'list',
}

const api = useApi()
const projects = ref<Project[]>([])
const loading = ref(true)
const projectDeployments = ref<Record<number, Deployment>>({})

const searchQuery = ref('')
const statusFilter = ref('all')
const sortOption = ref('name-asc')
const viewMode = ref(ViewMode.Grid)

onMounted(async () => {
  try {
    projects.value = []
    const fetchedProjects = await api.fetchProjects()

    if (Array.isArray(fetchedProjects)) {
      projects.value = fetchedProjects

      await Promise.all(
        fetchedProjects.map(async (project) => {
          try {
            const deployments = await api.fetchProjectDeployments(project.id)
            if (deployments && deployments.length > 0) {
              const latestDeployment = deployments.sort((a, b) =>
                new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
              )[0]

              projectDeployments.value[project.id] = latestDeployment
            }
          } catch (error) {
            console.error(`Error fetching deployments for project ${project.id}:`, error)
          }
        })
      )
    } else {
      console.error('Invalid projects data received:', fetchedProjects)
      projects.value = []
    }
  } catch (error) {
    console.error('Error fetching projects:', error)
    projects.value = []
  } finally {
    loading.value = false
  }
})

const filteredProjects = computed(() => {
  return projects.value
    .filter(project => {
      const matchesSearch = searchQuery.value === '' ||
        project.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        project.repositoryUrl.toLowerCase().includes(searchQuery.value.toLowerCase())

      const matchesStatus = statusFilter.value === 'all' ||
        (statusFilter.value === 'active' && project.active) ||
        (statusFilter.value === 'inactive' && !project.active)

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortOption.value) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        default:
          return 0
      }
    })
})

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  sortOption.value = 'name-asc'
}

const toast = useToast()
const triggerDeploy = async (projectId: number) => {
  try {
    const result = await api.triggerDeploy(projectId)
    if (result) {
      toast.success('Deployment triggered successfully!')

      projectDeployments.value[projectId] = result
    } else {
      toast.error('Failed to trigger deployment', 'Please try again.')
    }
  } catch (error) {
    console.error('Error triggering deployment:', error)
    toast.error('Failed to trigger deployment', 'Please try again.')
  }
}
</script>