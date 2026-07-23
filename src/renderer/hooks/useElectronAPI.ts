import type { Api } from "../../preload/renderer.d";

export function useElectronAPI(): Api {
  return window.electronAPI;
}
