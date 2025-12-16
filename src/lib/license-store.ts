import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LicenseTier = 'FREE' | 'PRO' | 'STUDIO';

interface LicenseState {
  tier: LicenseTier;
  licenseKey: string | null;
  expiresAt: Date | null;
  machineId: string | null;
  isValidating: boolean;
  lastValidated: Date | null;

  // Actions
  setTier: (tier: LicenseTier) => void;
  setLicenseKey: (key: string | null) => void;
  setMachineId: (id: string) => void;
  setValidating: (validating: boolean) => void;
  clearLicense: () => void;

  // Helpers
  isPro: () => boolean;
  isStudio: () => boolean;
  canUseFeature: (feature: PremiumFeature) => boolean;
}

// Features that require PRO or STUDIO
export type PremiumFeature =
  | 'ai_autofill'
  | 'rich_metadata'
  | 'all_formats'
  | 'all_bitrates'
  | 'no_watermark'
  | 'batch_processing'
  | 'chapter_editor'
  | 'audio_enhancement'
  | 'smart_artwork'
  | 'custom_cover'
  | 'save_project';

// Feature to tier mapping
const FEATURE_REQUIREMENTS: Record<PremiumFeature, LicenseTier[]> = {
  ai_autofill: ['PRO', 'STUDIO'],
  rich_metadata: ['PRO', 'STUDIO'],
  all_formats: ['PRO', 'STUDIO'],
  all_bitrates: ['PRO', 'STUDIO'],
  no_watermark: ['PRO', 'STUDIO'],
  batch_processing: ['STUDIO'],
  chapter_editor: ['PRO', 'STUDIO'],
  audio_enhancement: ['PRO', 'STUDIO'],
  smart_artwork: ['PRO', 'STUDIO'],
  custom_cover: ['PRO', 'STUDIO'],
  save_project: ['PRO', 'STUDIO'],
};

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      tier: 'FREE',
      licenseKey: null,
      expiresAt: null,
      machineId: null,
      isValidating: false,
      lastValidated: null,

      setTier: (tier) => set({ tier }),
      setLicenseKey: (key) => set({ licenseKey: key }),
      setMachineId: (id) => set({ machineId: id }),
      setValidating: (validating) => set({ isValidating: validating }),

      clearLicense: () => set({
        tier: 'FREE',
        licenseKey: null,
        expiresAt: null,
        lastValidated: null,
      }),

      isPro: () => {
        const { tier } = get();
        return tier === 'PRO' || tier === 'STUDIO';
      },

      isStudio: () => {
        const { tier } = get();
        return tier === 'STUDIO';
      },

      canUseFeature: (feature: PremiumFeature) => {
        const { tier } = get();
        const requiredTiers = FEATURE_REQUIREMENTS[feature];
        return requiredTiers.includes(tier);
      },
    }),
    {
      name: 'adb-binder-license',
      partialize: (state) => ({
        tier: state.tier,
        licenseKey: state.licenseKey,
        expiresAt: state.expiresAt,
        machineId: state.machineId,
        lastValidated: state.lastValidated,
      }),
    }
  )
);

// Hook for checking if upgrade is needed
export function useRequiresPro(feature: PremiumFeature): boolean {
  const canUse = useLicenseStore((s) => s.canUseFeature(feature));
  return !canUse;
}
