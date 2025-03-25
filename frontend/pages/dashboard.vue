<template>
    <div>

        <div v-if="loading" class="text-center py-10">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-500">Loading dashboard data...</p>
        </div>

        <div v-else>
            <!-- Stats Overview Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- Total Projects Card -->
                <div
                    class="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-blue-100 transform hover:-translate-y-1">
                    <div class="px-4 py-5 sm:p-6">
                        <div class="flex items-center">
                            <div
                                class="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md p-3 shadow-md">
                                <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dt class="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                                <dd class="flex items-baseline">
                                    <div class="text-2xl font-semibold text-gray-900">{{ projects.length }}</div>
                                    <div class="ml-2 text-sm font-medium text-gray-500">active</div>
                                </dd>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-100">
                        <div class="text-sm flex justify-between items-center">
                            <NuxtLink to="/projects"
                                class="font-medium text-blue-600 hover:text-blue-500 flex items-center">
                                View all projects
                                <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </NuxtLink>
                        </div>
                    </div>
                </div>

                <!-- Successful Deployments Card -->
                <div
                    class="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-green-100 transform hover:-translate-y-1">
                    <div class="px-4 py-5 sm:p-6">
                        <div class="flex items-center">
                            <div
                                class="flex-shrink-0 bg-gradient-to-r from-green-500 to-green-600 rounded-md p-3 shadow-md">
                                <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dt class="text-sm font-medium text-gray-500 truncate">Successful Deployments</dt>
                                <dd class="flex items-baseline">
                                    <div class="text-2xl font-semibold text-gray-900">{{ successfulDeployments }}</div>
                                    <div v-if="successfulDeployments > 0 && recentDeployments.length > 0"
                                        class="ml-2 text-sm font-medium text-green-600">
                                        {{ Math.round((successfulDeployments / deploymentsCount) * 100) }}%
                                    </div>
                                </dd>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-100">
                        <div class="text-sm flex justify-between items-center">
                            <NuxtLink to="/deployments"
                                class="font-medium text-blue-600 hover:text-blue-500 flex items-center">
                                View all deployments
                                <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </NuxtLink>
                        </div>
                    </div>
                </div>

                <!-- Failed Deployments Card -->
                <div
                    class="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-red-100 transform hover:-translate-y-1">
                    <div class="px-4 py-5 sm:p-6">
                        <div class="flex items-center">
                            <div
                                class="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-600 rounded-md p-3 shadow-md">
                                <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dt class="text-sm font-medium text-gray-500 truncate">Failed Deployments</dt>
                                <dd class="flex items-baseline">
                                    <div class="text-2xl font-semibold text-gray-900">{{ failedDeployments }}</div>
                                    <div v-if="failedDeployments > 0 && recentDeployments.length > 0"
                                        class="ml-2 text-sm font-medium text-red-600">
                                        {{ Math.round((failedDeployments / deploymentsCount) * 100) }}%
                                    </div>
                                </dd>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-100">
                        <div class="text-sm flex justify-between items-center">
                            <NuxtLink to="/deployments"
                                class="font-medium text-blue-600 hover:text-blue-500 flex items-center">
                                View failed deployments
                                <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </NuxtLink>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity Section -->
            <div class="mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div class="bg-white shadow-md overflow-hidden sm:rounded-lg border border-gray-100">
                    <div class="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg leading-6 font-medium text-gray-900">Recent Deployments</h3>
                            <NuxtLink to="/deployments" class="text-sm font-medium text-blue-600 hover:text-blue-500">
                                View all
                            </NuxtLink>
                        </div>
                    </div>
                    <div v-if="recentDeployments.length === 0"
                        class="px-4 py-10 sm:p-6 text-center text-gray-500 bg-gray-50 rounded-md">
                        <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        <h3 class="mt-2 text-sm font-medium text-gray-900">No deployments yet</h3>
                        <p class="mt-1 text-sm text-gray-500">Deployments will appear here when you deploy a project.
                        </p>
                    </div>
                    <div v-else class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Project</th>
                                    <th scope="col"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status</th>
                                    <th scope="col"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Commit</th>
                                    <th scope="col"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Started</th>
                                    <th scope="col"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="deployment in recentDeployments" :key="deployment.id"
                                    class="hover:bg-gray-50 transition-colors duration-150">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div class="flex items-center">
                                            <div
                                                class="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                                                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                                                    viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                </svg>
                                            </div>
                                            <div class="ml-3">
                                                <NuxtLink :to="`/projects/${deployment.projectId}`"
                                                    class="text-blue-600 hover:text-blue-900">
                                                    {{ deployment.project?.name || 'Not linked project' }}
                                                </NuxtLink>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                                        <span :class="{
            'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full': true,
            'bg-green-100 text-green-800': deployment.status === 'completed',
            'bg-yellow-100 text-yellow-800': deployment.status === 'pending' || deployment.status === 'in_progress',
            'bg-red-100 text-red-800': deployment.status === 'failed'
        }">
                                            {{ deployment.status }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span class="font-mono bg-gray-100 px-2 py-1 rounded">{{
            deployment.commitHash.substring(0, 7)
        }}</span>
                                        <div class="mt-1 text-xs text-gray-500 truncate max-w-xs">{{
                deployment.commitMessage || 'No commit message' }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ new Date(deployment.startedAt).toLocaleString() }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <NuxtLink :to="`/deployments/${deployment.id}`"
                                            class="text-blue-600 hover:text-blue-900 inline-flex items-center">
                                            View details
                                            <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </NuxtLink>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import type { Project, Deployment } from '~/types'
import { useProjects } from '~/composables/useProjects'
import { useDeployments } from '~/composables/useDeployments'

const { fetchProjects } = useProjects()
const { fetchDeployments } = useDeployments()
const projects = ref<Project[]>([])
const recentDeployments = ref<Deployment[]>([])
const deploymentsCount = ref<number>(0)
const loading = ref(true)

const successfulDeployments = ref<number>(0)

const failedDeployments = ref<number>(0)

onMounted(async () => {
    loading.value = true
    
    const [projectsData, deploymentsData] = await Promise.all([
        fetchProjects(),
        fetchDeployments()
    ])

    projects.value = projectsData
    recentDeployments.value = deploymentsData.slice(0, 5)
    successfulDeployments.value = deploymentsData.filter(d => d.status === 'completed').length
    failedDeployments.value = deploymentsData.filter(d => d.status === 'failed').length
    deploymentsCount.value = deploymentsData.length
    
    loading.value = false
})
</script>