import type { ATSProvider } from '@/types/ats';

const AI_MODE_STORAGE_KEY = 'placemind.aiMode';

export class AIServiceClient {
  static getPreferredAIMode(): ATSProvider {
    if (typeof window === 'undefined') return 'ollama';

    try {
      const savedMode = window.localStorage.getItem(AI_MODE_STORAGE_KEY);
      if (savedMode === 'cloud' || savedMode === 'local' || savedMode === 'ollama') {
        return savedMode;
      }

      return 'ollama';
    } catch {
      return 'ollama';
    }
  }
}