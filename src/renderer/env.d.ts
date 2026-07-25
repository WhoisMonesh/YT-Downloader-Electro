import type { Api } from '../preload/renderer.d';

declare global {
  interface Window {
    electronAPI: Api;
    api: Api;
  }
}

export {};
