import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, FileAudio, Edit3, Volume2, Layers, Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

const PRO_FEATURES = [
  { icon: Sparkles, label: 'AI Metadata Auto-Fill' },
  { icon: FileAudio, label: 'All Export Formats & Bitrates' },
  { icon: Edit3, label: 'Rich Chapter Editing' },
  { icon: Volume2, label: 'Audio Enhancement' },
];

const STUDIO_FEATURES = [
  ...PRO_FEATURES,
  { icon: Layers, label: 'Batch Processing' },
];

export function UpgradeModal({ isOpen, onClose, featureName }: UpgradeModalProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  const handleValidateLicense = async () => {
    if (!licenseKey.trim()) return;

    setValidating(true);
    setError('');

    try {
      // TODO: Implement actual license validation
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Placeholder: check if key matches pattern
      if (licenseKey.startsWith('ADB-PRO-') || licenseKey.startsWith('ADB-STUDIO-')) {
        // Success - would actually validate against backend
        onClose();
      } else {
        setError('Invalid license key');
      }
    } catch (err) {
      setError('Failed to validate license');
    } finally {
      setValidating(false);
    }
  };

  const handlePurchase = (tier: 'PRO' | 'STUDIO') => {
    // TODO: Open purchase URL
    const purchaseUrl = tier === 'PRO'
      ? 'https://your-store.com/adb-binder-pro'
      : 'https://your-store.com/adb-binder-studio';
    window.open(purchaseUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#0a0a0c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/[0.05] transition-colors z-10"
            >
              <X className="w-5 h-5 text-[#8A8F98]" />
            </button>

            {/* Header */}
            <div className="relative px-8 pt-8 pb-6 text-center border-b border-white/[0.06]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#5E6AD2]/10 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-4">
                  <Crown className="w-4 h-4" />
                  <span>Premium Feature</span>
                </div>
                <h2 className="text-2xl font-bold text-[#EDEDEF] mb-2">
                  Unlock {featureName || 'PRO Features'}
                </h2>
                <p className="text-[#8A8F98]">
                  Upgrade to access powerful audiobook creation tools
                </p>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* PRO Card */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-[#5E6AD2]" />
                    <h3 className="text-lg font-semibold text-[#EDEDEF]">PRO</h3>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-[#EDEDEF]">$19.99</span>
                    <span className="text-[#8A8F98] ml-1">one-time</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {PRO_FEATURES.map(({ icon: _Icon, label }) => (
                      <li key={label} className="flex items-center gap-2 text-sm text-[#8A8F98]">
                        <Check className="w-4 h-4 text-[#5E6AD2]" />
                        {label}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePurchase('PRO')}
                    className={cn(
                      "w-full font-semibold rounded-lg",
                      "bg-[#5E6AD2] hover:bg-[#6872D9] text-white"
                    )}
                  >
                    Get PRO
                  </Button>
                </div>

                {/* STUDIO Card */}
                <div className="rounded-xl border border-[#5E6AD2]/30 bg-gradient-to-b from-[#5E6AD2]/10 to-transparent p-6 relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#5E6AD2] text-white text-xs font-medium">
                    Best Value
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-semibold text-[#EDEDEF]">STUDIO</h3>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-[#EDEDEF]">$49.99</span>
                    <span className="text-[#8A8F98] ml-1">one-time</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {STUDIO_FEATURES.map(({ icon: _Icon, label }) => (
                      <li key={label} className="flex items-center gap-2 text-sm text-[#8A8F98]">
                        <Check className="w-4 h-4 text-amber-400" />
                        {label}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePurchase('STUDIO')}
                    className={cn(
                      "w-full font-semibold rounded-lg",
                      "bg-gradient-to-r from-[#5E6AD2] to-[#7C3AED] hover:opacity-90 text-white"
                    )}
                  >
                    Get STUDIO
                  </Button>
                </div>
              </div>

              {/* License Key Input */}
              <div className="border-t border-white/[0.06] pt-6">
                {showKeyInput ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                        placeholder="ADB-PRO-XXXX-XXXX-XXXX"
                        className="flex-1 h-10 px-4 bg-[#0F0F12] border border-white/10 rounded-lg text-[#EDEDEF] font-mono text-sm focus:outline-none focus:border-[#5E6AD2]"
                      />
                      <Button
                        onClick={handleValidateLicense}
                        disabled={validating || !licenseKey.trim()}
                        className="px-6 bg-[#5E6AD2] hover:bg-[#6872D9] text-white"
                      >
                        {validating ? 'Validating...' : 'Activate'}
                      </Button>
                    </div>
                    {error && (
                      <p className="text-red-400 text-sm">{error}</p>
                    )}
                    <button
                      onClick={() => setShowKeyInput(false)}
                      className="text-sm text-[#8A8F98] hover:text-[#EDEDEF]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowKeyInput(true)}
                    className="text-sm text-[#8A8F98] hover:text-[#EDEDEF]"
                  >
                    Already have a license key? <span className="text-[#5E6AD2]">Enter it here</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
