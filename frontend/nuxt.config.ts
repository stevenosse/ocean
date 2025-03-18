export default defineNuxtConfig({
  // Disable SSR for SPA mode
  ssr: false,

  // App configuration
  app: {
    head: {
      title: 'Ocean - Deployment Automation',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Deployment automation tool for Docker containers' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/tailwindcss
    '@nuxtjs/tailwindcss',
  ],

  // Runtime config for API URL
  runtimeConfig: {
    public: {
      apiURL: process.env.API_URL || 'http://localhost:3000'
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},

  // Server configuration to use a different port
  server: {
    port: 3001, // Use port 3001 instead of default 3000
    host: '0.0.0.0' // Allow connections from all network interfaces
  },

  compatibilityDate: '2025-03-18'
})