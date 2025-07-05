import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CSC Docs',
  tagline: 'Collection of CSC Documentation',
  favicon: 'img/csc-logo.png',

  // GitHub Pages settings:
  url: 'https://creative-system-consultant.github.io', // Your GitHub Pages URL (no trailing slash)
  baseUrl: '/csc-docs/',                               // The repo name as a subpath
  organizationName: 'creative-system-consultant',      // GitHub org/user name
  projectName: 'csc-docs',                             // GitHub repo name
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  // Future flags (optional)
  future: {
    v4: true,
  },

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/creative-system-consultant/csc-docs',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/creative-system-consultant/csc-docs',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/csc-logo.png',
    navbar: {
      title: 'CSC Documentation',
      logo: {
        alt: 'CSC Logo',
        src: 'img/csc-logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/creative-system-consultant/csc-docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
