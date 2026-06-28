import type { GroupState } from './types';

const CURRENT_KEY = 'splitwhat_current_group';
const RECENTS_KEY = 'splitwhat_recent_groups';

// Validate structure of a parsed state to check for corruption
function isValidGroupState(state: any): state is GroupState {
  if (!state || typeof state !== 'object') return false;
  if (typeof state.id !== 'string' || typeof state.name !== 'string') return false;
  if (typeof state.currency !== 'string') return false;
  if (!Array.isArray(state.members) || !Array.isArray(state.expenses)) return false;
  if (state.mode !== 'travel' && state.mode !== 'subscription') return false;
  return true;
}

export function saveCurrentGroup(state: GroupState): void {
  try {
    if (!state) return;
    localStorage.setItem(CURRENT_KEY, JSON.stringify(state));
    saveToRecents(state);
  } catch (e) {
    console.error('Failed to save current group to localStorage:', e);
  }
}

export function loadCurrentGroup(): GroupState | null {
  try {
    const data = localStorage.getItem(CURRENT_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (isValidGroupState(parsed)) {
      return parsed;
    } else {
      console.warn('Corrupt group state found in localStorage, clearing...');
      localStorage.removeItem(CURRENT_KEY);
      return null;
    }
  } catch (e) {
    console.error('Failed to load current group from localStorage:', e);
    return null;
  }
}

export function saveToRecents(state: GroupState): void {
  try {
    const recents = loadRecents();
    // Remove if already exists with same ID to avoid duplicates
    const filtered = recents.filter((r) => r.id !== state.id);
    
    // We only want to save a snapshot. Keep last 5.
    filtered.unshift(state);
    const trimmed = filtered.slice(0, 5);
    
    localStorage.setItem(RECENTS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save to recents:', e);
  }
}

export function loadRecents(): GroupState[] {
  try {
    const data = localStorage.getItem(RECENTS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      const validRecents = parsed.filter(isValidGroupState);
      return validRecents;
    }
    return [];
  } catch (e) {
    console.error('Failed to load recents from localStorage:', e);
    return [];
  }
}

export function clearCurrentGroup(): void {
  try {
    localStorage.removeItem(CURRENT_KEY);
  } catch (e) {
    console.error('Failed to clear current group:', e);
  }
}

export function clearAll(): void {
  try {
    localStorage.removeItem(CURRENT_KEY);
    localStorage.removeItem(RECENTS_KEY);
  } catch (e) {
    console.error('Failed to clear localStorage data:', e);
  }
}
