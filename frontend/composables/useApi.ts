import axios from 'axios'
import type { AxiosInstance } from "axios";
import { useCookie, useRuntimeConfig } from 'nuxt/app';

export interface ConfigurationOptions {
    basePath: string;
}

export const extractErrorMessage = (error: any) => {
    if (error.response?.data?.message && Array.isArray(error.response?.data?.message)) {
        return error.response?.data?.message.join('\n')
    }
    
    return error.response?.data?.message || error.message || 'Unknown error'
}

export const useApi = () => {
    let isRefreshing = false
    let failedQueue: Array<{
        resolve: (token: string) => void
        reject: (error: any) => void
    }> = []

    const processQueue = (error: any, token: string | null = null) => {
        failedQueue.forEach((prom) => {
            if (error) {
                prom.reject(error)
            } else {
                prom.resolve(token!)
            }
        })
        failedQueue = []
    }

    const runtimeConfig = useRuntimeConfig()
    const axiosInstance: AxiosInstance = axios.create({
        baseURL: (runtimeConfig.public.apiBaseUrl as string) || 'http://localhost:3000',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json'
        }
    })

    axiosInstance.interceptors.request.use(
        (config) => {
            const accessToken = useCookie('access_token').value
            if (accessToken) {
                config.headers['Authorization'] = `Bearer ${accessToken}`
            }
            return config
        },
        (error) => {
            return Promise.reject(error)
        }
    )

    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config

            if (originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/register') ||
                originalRequest.url?.includes('/auth/token/refresh')) {
                return Promise.reject(error)
            }

            if (originalRequest._retry || error.response?.status !== 401) {
                return Promise.reject(error)
            }

            if (originalRequest.url === '/auth/token/refresh') {
                useCookie('access_token').value = null
                useCookie('refresh_token').value = null
                if (import.meta.client) {
                    window.location.reload()
                }
                return Promise.reject({
                    message: 'Session expired. Please login again.'
                })
            }

            if (isRefreshing) {
                try {
                    const token = await new Promise<string>((resolve, reject) => {
                        failedQueue.push({ resolve, reject })
                    })
                    originalRequest.headers['Authorization'] = `Bearer ${token}`
                    return axiosInstance(originalRequest)
                } catch (err) {
                    return Promise.reject(err)
                }
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const refreshTokenValue = useCookie('refresh_token').value
                if (!refreshTokenValue) {
                    throw new Error('No refresh token available')
                }

                const response = await axiosInstance.post(
                    '/auth/token/refresh',
                    { refreshToken: refreshTokenValue }
                )

                const { data } = response
                const newToken = data.accessToken

                if (newToken) {
                    useCookie('access_token').value = newToken
                    if (data.refreshToken) {
                        useCookie('refresh_token').value = data.refreshToken
                    }

                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`
                    processQueue(null, newToken)
                    return axiosInstance(originalRequest)
                }

                throw new Error('Failed to refresh token')

            } catch (refreshError: any) {
                processQueue(refreshError, null)
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }
    )

    const config = {
        basePath: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
    } as ConfigurationOptions

    return {
        config,
        axiosInstance
    }
}