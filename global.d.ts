// Type declarations for importing CSS and static assets in TypeScript
// Prevents "Could not find declaration file" errors for imports like `import './globals.css'` or `import '@fontsource/inter/index.css'`.

declare module '*.css';
declare module '*.scss';
declare module '*.module.css';
declare module '*.module.scss';

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
