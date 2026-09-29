import type { AIMode } from '@/types/ats';

const AI_MODE_STORAGE_KEY = 'placemind.aiMode';

export class AIServiceClient {
  static getPreferredAIMode(): AIMode {
    if (typeof window === 'undefined') return 'cloud';

    try {
      return window.localStorage.getItem(AI_MODE_STORAGE_KEY) === 'local' ? 'local' : 'cloud';
    } catch {
      return 'cloud';
    }
  }
}