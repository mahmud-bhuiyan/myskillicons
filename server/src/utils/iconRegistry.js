// This file maps icon short names to their file paths and metadata
// Add more icons here as you expand the library

const iconRegistry = {
  js: {
    name: 'JavaScript',
    file: 'js.svg',
    category: 'language',
    themes: {
      light: { bg: '#F7DF1E', primary: '#323330' },
      dark:  { bg: '#323330', primary: '#F7DF1E' },
      auto:  { bg: '#F7DF1E', primary: '#323330' },
    }
  },
  react: {
    name: 'React',
    file: 'react.svg',
    category: 'framework',
    themes: {
      light: { bg: '#E8F4FD', primary: '#61DAFB' },
      dark:  { bg: '#20232A', primary: '#61DAFB' },
      auto:  { bg: '#20232A', primary: '#61DAFB' },
    }
  },
  nodejs: {
    name: 'Node.js',
    file: 'nodejs.svg',
    category: 'runtime',
    themes: {
      light: { bg: '#EBF5EB', primary: '#339933' },
      dark:  { bg: '#1A2A1A', primary: '#68CC68' },
      auto:  { bg: '#1A2A1A', primary: '#68CC68' },
    }
  },
  python: {
    name: 'Python',
    file: 'python.svg',
    category: 'language',
    themes: {
      light: { bg: '#FFF8E1', primary: '#3776AB' },
      dark:  { bg: '#1A1A2E', primary: '#FFD43B' },
      auto:  { bg: '#1A1A2E', primary: '#FFD43B' },
    }
  },
  mongodb: {
    name: 'MongoDB',
    file: 'mongodb.svg',
    category: 'database',
    themes: {
      light: { bg: '#E8F5E9', primary: '#47A248' },
      dark:  { bg: '#0D1B0F', primary: '#47A248' },
      auto:  { bg: '#0D1B0F', primary: '#47A248' },
    }
  },
  html: {
    name: 'HTML5',
    file: 'html.svg',
    category: 'language',
    themes: {
      light: { bg: '#FFF3E0', primary: '#E34F26' },
      dark:  { bg: '#2A1506', primary: '#FF6B35' },
      auto:  { bg: '#2A1506', primary: '#FF6B35' },
    }
  },
  css: {
    name: 'CSS3',
    file: 'css.svg',
    category: 'language',
    themes: {
      light: { bg: '#E3F2FD', primary: '#1572B6' },
      dark:  { bg: '#051524', primary: '#1572B6' },
      auto:  { bg: '#051524', primary: '#1572B6' },
    }
  },
  typescript: {
    name: 'TypeScript',
    file: 'typescript.svg',
    category: 'language',
    themes: {
      light: { bg: '#E8F0FB', primary: '#3178C6' },
      dark:  { bg: '#0D1926', primary: '#3178C6' },
      auto:  { bg: '#0D1926', primary: '#3178C6' },
    }
  },
  vue: {
    name: 'Vue.js',
    file: 'vue.svg',
    category: 'framework',
    themes: {
      light: { bg: '#E8F8F0', primary: '#42B883' },
      dark:  { bg: '#0D1F17', primary: '#42B883' },
      auto:  { bg: '#0D1F17', primary: '#42B883' },
    }
  },
  docker: {
    name: 'Docker',
    file: 'docker.svg',
    category: 'tool',
    themes: {
      light: { bg: '#E6F4FB', primary: '#2496ED' },
      dark:  { bg: '#0A1628', primary: '#2496ED' },
      auto:  { bg: '#0A1628', primary: '#2496ED' },
    }
  },
  git: {
    name: 'Git',
    file: 'git.svg',
    category: 'tool',
    themes: {
      light: { bg: '#FDECE7', primary: '#F05032' },
      dark:  { bg: '#2A100A', primary: '#F05032' },
      auto:  { bg: '#2A100A', primary: '#F05032' },
    }
  },
  github: {
    name: 'GitHub',
    file: 'github.svg',
    category: 'tool',
    themes: {
      light: { bg: '#F0F0F0', primary: '#181717' },
      dark:  { bg: '#181717', primary: '#FFFFFF' },
      auto:  { bg: '#181717', primary: '#FFFFFF' },
    }
  },
  express: {
    name: 'Express',
    file: 'express.svg',
    category: 'framework',
    themes: {
      light: { bg: '#F0F0F0', primary: '#000000' },
      dark:  { bg: '#1A1A1A', primary: '#FFFFFF' },
      auto:  { bg: '#1A1A1A', primary: '#FFFFFF' },
    }
  },
  nextjs: {
    name: 'Next.js',
    file: 'nextjs.svg',
    category: 'framework',
    themes: {
      light: { bg: '#F0F0F0', primary: '#000000' },
      dark:  { bg: '#000000', primary: '#FFFFFF' },
      auto:  { bg: '#000000', primary: '#FFFFFF' },
    }
  },
  tailwind: {
    name: 'Tailwind CSS',
    file: 'tailwind.svg',
    category: 'framework',
    themes: {
      light: { bg: '#E0F7FA', primary: '#06B6D4' },
      dark:  { bg: '#0B1C24', primary: '#38BDF8' },
      auto:  { bg: '#0B1C24', primary: '#38BDF8' },
    }
  },
  postgresql: {
    name: 'PostgreSQL',
    file: 'postgresql.svg',
    category: 'database',
    themes: {
      light: { bg: '#E8EEF7', primary: '#4169E1' },
      dark:  { bg: '#0D1526', primary: '#4169E1' },
      auto:  { bg: '#0D1526', primary: '#4169E1' },
    }
  },
  redis: {
    name: 'Redis',
    file: 'redis.svg',
    category: 'database',
    themes: {
      light: { bg: '#FDE8E8', primary: '#DC382D' },
      dark:  { bg: '#2A0A0A', primary: '#DC382D' },
      auto:  { bg: '#2A0A0A', primary: '#DC382D' },
    }
  },
};

module.exports = iconRegistry;
