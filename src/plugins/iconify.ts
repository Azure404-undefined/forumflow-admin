import { addAPIProvider } from '@iconify/vue';

/** Configure an optional custom Iconify API provider. */
export function setupIconify() {
  const { VITE_ICONIFY_URL } = import.meta.env;

  if (VITE_ICONIFY_URL) {
    addAPIProvider('', { resources: [VITE_ICONIFY_URL] });
  }
}
