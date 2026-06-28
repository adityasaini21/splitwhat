import LZString from 'lz-string';
import type { GroupState } from './types';
import { sanitizeGroupState } from './validate';

// Max safe URL length for general sharing (especially messaging services and some older platforms)
export const MAX_SAFE_URL_LENGTH = 2000;

export function encodeStateToUrl(state: GroupState): string {
  try {
    const json = JSON.stringify(state);
    const compressed = LZString.compressToEncodedURIComponent(json);
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('g', compressed);
    return url.toString();
  } catch (err) {
    console.error('Failed to encode group state to URL:', err);
    return window.location.origin + window.location.pathname;
  }
}

export function decodeStateFromUrl(urlStr: string): GroupState | null {
  try {
    const url = new URL(urlStr);
    const compressed = url.searchParams.get('g');
    if (!compressed) return null;
    
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (!decompressed) return null;
    
    const parsed = JSON.parse(decompressed);
    return sanitizeGroupState(parsed);
  } catch (err) {
    console.error('Failed to decode group state from URL:', err);
    return null;
  }
}

export function getWhatsAppShareUrl(url: string, groupName: string): string {
  const text = `Join my SplitWhat bill splitter for "${groupName}": ${url}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

export function isUrlLengthWarning(url: string): boolean {
  return url.length > MAX_SAFE_URL_LENGTH;
}
