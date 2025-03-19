<template>
  <div>
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Projects</h1>
      <NuxtLink
        to="/projects/new"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg
          class="-ml-1 mr-2 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span>New Project</span>
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-10">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
      ></div>
      <p class="mt-2 text-gray-500">Loading projects...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="projects.length === 0"
      class="bg-white shadow overflow-hidden sm:rounded-lg"
    >
      <div class="px-4 py-12 text-center">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">No projects</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
        <div class="mt-6">
          <NuxtLink
            to="/projects/new"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              class="-ml-1 mr-2 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Create a project</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Projects Grid -->
    <div
      v-else
      class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="project in projects"
        :key="project.id"
        class="bg-white shadow-md rounded-lg max-w-md mx-auto border border-gray-200 hover:shadow-lg transition-shadow duration-300"
      >
        <!-- Card Body -->
        <div class="p-5">
          <div class="flex items-start space-x-4">
            <!-- Folder Icon -->
            <div
              class="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-blue-600 text-white"
            >
              <svg
                class="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>

            <!-- Project Info -->
            <div>
              <!-- Project Name -->
              <div class="text-lg font-semibold text-blue-600">
                <NuxtLink
                  :to="`/projects/${project.id}`"
                  class="hover:underline"
                >
                  {{ project.name }}
                </NuxtLink>
              </div>

              <!-- Repository URL -->
              <div class="mt-1 text-sm text-gray-500 flex items-center">
                <svg
                  class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <a
                  :href="project.repositoryUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:underline truncate"
                >
                  {{ project.repositoryUrl }}
                </a>
              </div>

              <!-- Branch -->
              <div class="mt-1 text-sm text-gray-500 flex items-center">
                <svg
                  class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
                <span>{{ project.branch || 'default branch' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="border-t border-gray-200 px-5 py-4 flex justify-end space-x-2">
          <NuxtLink
            :to="`/projects/${project.id}`"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            View
          </NuxtLink>
          <NuxtLink
            :to="`/projects/${project.id}/edit`"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Edit
          </NuxtLink>
          <button
            @click="triggerDeploy(project.id)"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            Deploy
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import type { Project } from '~/types'
import { useToast } from '~/composables/useToast'

const api = useApi()
const projects = ref<Project[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    // Clear projects array before fetching to prevent duplicates
    projects.value = []
    const fetchedProjects = await api.fetchProjects()
    // Ensure we're getting a valid array of projects
    if (Array.isArray(fetchedProjects)) {
      projects.value = fetchedProjects
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

const toast = useToast()
const triggerDeploy = async (projectId: number) => {
  try {
    const result = await api.triggerDeploy(projectId)
    if (result) {
      toast.success('Deployment triggered successfully!')
    } else {
      toast.error('Failed to trigger deployment', 'Please try again.')
    }
  } catch (error) {
    console.error('Error triggering deployment:', error)
    toast.error('Failed to trigger deployment', 'Please try again.')
  }
}
</script>