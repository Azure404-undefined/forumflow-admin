import { addCollection } from '@iconify/vue/offline';
import offlineIconCollections from '@/assets/iconify-offline';

/** Register the Iconify icons used by runtime-rendered components. */
export function setupIconifyOffline() {
  offlineIconCollections.forEach(collection => addCollection(collection));
}
