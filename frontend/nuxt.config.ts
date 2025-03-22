export default defineNuxtConfig({
  ssr: false,
  app: {
    head: {
      title: 'Ocean - Turn your computer to a server',
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
  css: [],
  plugins: [
    '~/plugins/auth.ts'
  ],
  router: {
    middleware: ['auth']
  },
  components: true,
  modules: [
    '@nuxtjs/tailwindcss',
  ],
  runtimeConfig: {
    public: {
      apiURL: process.env.API_URL || 'http://localhost:3000'
    }
  },
  build: {},
  server: {
    port: 3001,
    host: '0.0.0.0'
  },

  compatibilityDate: '2025-03-18'
})