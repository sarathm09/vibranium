import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vibranium CLI',
  description: 'Modern scenario-driven API testing with TypeScript, Nx, and Ink',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Vibranium CLI | Modern API Testing' }],
    ['meta', { property: 'og:site_name', content: 'Vibranium CLI' }],
    ['meta', { property: 'og:url', content: 'https://sarathm09.github.io/vibranium/' }],
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/cli-commands' },
      { text: 'Plugins', link: '/plugins/overview' },
      { text: 'Examples', link: '/examples/basic-testing' },
      {
        text: 'GitHub',
        link: 'https://github.com/sarathm09/vibranium'
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Writing Scenarios', link: '/guide/writing-scenarios' },
            { text: 'Variable System', link: '/guide/variables' },
            { text: 'Validation & Testing', link: '/guide/validation' },
            { text: 'Environments', link: '/guide/environments' },
            { text: 'Dependencies', link: '/guide/dependencies' }
          ]
        },
        {
          text: 'Advanced Features',
          items: [
            { text: 'Lifecycle Hooks', link: '/guide/lifecycle' },
            { text: 'Content Types', link: '/guide/content-types' },
            { text: 'Authentication', link: '/guide/authentication' },
            { text: 'Reporting', link: '/guide/reporting' }
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'CLI Commands', link: '/reference/cli-commands' },
            { text: 'Scenario Syntax', link: '/reference/scenario-syntax' },
            { text: 'Validation Operators', link: '/reference/validation-operators' },
            { text: 'Configuration File', link: '/reference/configuration' },
            { text: 'Environment Variables', link: '/reference/environment-variables' },
            { text: 'HTTP Client Options', link: '/reference/http-client' }
          ]
        }
      ],
      '/plugins/': [
        {
          text: 'Plugin System',
          items: [
            { text: 'Overview', link: '/plugins/overview' },
            { text: 'API Plugin', link: '/plugins/api-plugin' },
            { text: 'Plugin Development', link: '/plugins/development' },
            { text: 'Plugin Registry', link: '/plugins/registry' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic API Testing', link: '/examples/basic-testing' },
            { text: 'Authentication Flows', link: '/examples/authentication' },
            { text: 'Complex Workflows', link: '/examples/workflows' },
            { text: 'Data Validation', link: '/examples/validation' },
            { text: 'Environment Management', link: '/examples/environments' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sarathm09/vibranium' }
    ],

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/sarathm09/vibranium/edit/main/apps/docs/:path',
      text: 'Edit this page on GitHub'
    },

    footer: {
      message: 'Released under the ISC License.',
      copyright: 'Copyright © 2025 Sarath M'
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },

  vite: {
    resolve: {
      alias: {
        '@': '/apps/docs/.vitepress/theme'
      }
    }
  },

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => false,
        whitespace: 'preserve'
      }
    }
  }
})