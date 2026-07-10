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
};

module.exports = iconRegistry;
