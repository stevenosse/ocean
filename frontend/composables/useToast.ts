import { ref, reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
  timeout?: number
}

// Create a reactive state that persists across component instances
const toasts = ref<Toast[]>([])
let toastCounter = 0

export const useToast = () => {
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = ++toastCounter
    const timeout = toast.timeout ?? 5000 // Default timeout of 5 seconds
    
    // Add the toast to the array
    toasts.value.push({
      id,
      ...toast
    })
    
    // Automatically remove the toast after the timeout
    if (timeout > 0) {
      setTimeout(() => {
        removeToast(id)
      }, timeout)
    }
    
    return id
  }
  
  const removeToast = (id: number) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const clearToasts = () => {
    toasts.value = []
  }
  
  // Helper methods for different toast types
  const success = (title: string, message?: string, timeout?: number) => {
    return addToast({ type: 'success', title, message, timeout })
  }
  
  const error = (title: string, message?: string, timeout?: number) => {
    return addToast({ type: 'error', title, message, timeout })
  }
  
  const warning = (title: string, message?: string, timeout?: number) => {
    return addToast({ type: 'warning', title, message, timeout })
  }
  
  const info = (title: string, message?: string, timeout?: number) => {
    return addToast({ type: 'info', title, message, timeout })
  }
  
  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info
  }
}