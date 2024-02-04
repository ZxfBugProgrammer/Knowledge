import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-Hans',
  title: "Knowledge",
  description: "个人知识梳理",

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/notebook.svg' }]
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/' },
      { text: '笔记', link: '/cpp/Modern CMake & ECM' }
    ],

    logo: { src: '/notebook.svg', width: 24, height: 24 },

    sidebar: [
      {
        text: 'C++',
        collapsed: false,
        items: [
          { text: 'Modern CMake & ECM', link: '/cpp/Modern CMake & ECM' },
          { text: '动态库加载 学习', link: '/cpp/动态库加载 学习' },
          {
            text: 'Qt',
            collapsed: true,
            items: [
              { text: 'Qt Qml Debug 小结', link: '/cpp/qt/Qt Qml Debug 小结' },
              { text: 'Qt 事件循环', link: '/cpp/qt/Qt 事件循环' },
            ]
          }
        ]
      },
      {
        text: 'Linux',
        collapsed: false,
        items: [
          {
            text: 'D-Bus',
            collapsed: true,
            items: [
              { text: 'D-Bus 学习', link: '/linux/d-bus/DBus 学习' },
              { text: 'Qt D-Bus 学习笔记', link: '/linux/d-bus/Qt D-Bus 学习笔记' },
              { text: 'D-Bus 调试工具小结', link: '/linux/d-bus/D-Bus 调试工具小结' },
              { text: 'KDE D-Bus 文档翻译', link: '/linux/d-bus/KDE D-Bus 文档翻译' }
            ]
          },
          { text: 'Linux 图形体系概述 & Wayland 协议', link: '/linux/Linux 图形体系概述 & Wayland 协议' },
          { text: 'Linux 文件时间属性', link: '/linux/Linux 文件时间属性' },
          { text: '国际化(多语言)方案', link: '/linux/国际化(多语言)方案' },
        ]
      },
      {
        text: 'Android',
        collapsed: false,
        items: [
          { text: 'RecyclerView初探', link:'/android/RecyclerView初探'}
        ]
      },
      {
        text: 'AI',
        collapsed: false,
        items: [
          { text: 'LangChain -- AI应用开发工具库', link:'/ai/LangChain -- AI应用开发工具库'}
        ]
      },
      {
        text: '杂项',
        collapsed: false,
        items: [
          { text: 'MacOS配置', link:'/other/MacOS配置'}
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ZxfBugProgrammer/Knowledge' }
    ],

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      level: [1,3],
      label: '页面导航'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    langMenuLabel: '多语言',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
