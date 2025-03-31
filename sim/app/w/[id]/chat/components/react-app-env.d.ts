/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="next" />
/// <reference types="uuid" />

interface Window {
  // Extend the Window interface if needed
}

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly GEMINI_API_KEY?: string;
    readonly NEXT_PUBLIC_APP_URL?: string;
  }
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  const src: string;
  export default src;
} 