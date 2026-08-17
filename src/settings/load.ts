import type { Settings } from '../sigma/types';
import { DEFAULT_SETTINGS } from './defaults';

/**
 * Parses the plugin's persisted `settings` JSON field and merges it over
 * defaults. Always merges rather than replacing outright, so:
 *   - malformed/empty JSON falls back to defaults instead of breaking the plugin
 *   - settings keys added in a future version of the plugin get sane defaults
 *     on workbooks saved with an older version
 */
export function loadSettings(json: string | undefined): Settings {
  if (!json || !json.trim()) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object') {
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('[kpi-gauge] Invalid settings JSON, falling back to defaults:', err);
  }

  return { ...DEFAULT_SETTINGS };
}

export function serializeSettings(settings: Settings): string {
  return JSON.stringify(settings, null, 2);
}
