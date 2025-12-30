import { useState } from 'react';
import { Check, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  BUILTIN_PRESETS,
  AUDIO_FORMATS,
  generatePresetId,
  type ConversionPreset,
  type AudioFormat,
} from '@/lib/conversion-presets';

interface ProfileSelectorProps {
  selectedPresetId: string;
  onPresetChange: (preset: ConversionPreset) => void;
  userPresets: ConversionPreset[];
  onSaveUserPreset: (preset: ConversionPreset) => void;
  onDeleteUserPreset: (presetId: string) => void;
  currentSettings?: {
    format: AudioFormat;
    bitrate: string;
  };
}

export function ProfileSelector({
  selectedPresetId,
  onPresetChange,
  userPresets,
  onSaveUserPreset,
  onDeleteUserPreset,
  currentSettings,
}: ProfileSelectorProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Combine built-in and user presets
  const allPresets = [...BUILTIN_PRESETS, ...userPresets];
  const selectedPreset = allPresets.find((p) => p.id === selectedPresetId);

  const handleSaveNewPreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    if (!currentSettings) {
      toast.error('No settings to save');
      return;
    }

    const newPreset: ConversionPreset = {
      id: generatePresetId(),
      name: newPresetName.trim(),
      targetFormat: currentSettings.format,
      bitrate: currentSettings.bitrate,
      description: `Custom: ${AUDIO_FORMATS[currentSettings.format].description} @ ${currentSettings.bitrate || 'lossless'}`,
      icon: '⭐',
      isBuiltIn: false,
    };

    onSaveUserPreset(newPreset);
    setNewPresetName('');
    setShowSaveDialog(false);
    toast.success(`Saved preset "${newPreset.name}"`);
  };

  const handleDeletePreset = (presetId: string) => {
    const preset = userPresets.find((p) => p.id === presetId);
    if (preset) {
      onDeleteUserPreset(presetId);
      toast.success(`Deleted preset "${preset.name}"`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Preset Selector */}
        <Select
          value={selectedPresetId}
          onValueChange={(id) => {
            const preset = allPresets.find((p) => p.id === id);
            if (preset) onPresetChange(preset);
          }}
        >
          <SelectTrigger className="flex-1 bg-[#0F0F12] border-white/10">
            <SelectValue>
              {selectedPreset ? (
                <span className="flex items-center gap-2">
                  <span>{selectedPreset.icon}</span>
                  <span>{selectedPreset.name}</span>
                </span>
              ) : (
                'Select a preset...'
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-[#0F0F12] border-white/10">
            {/* Built-in presets */}
            <div className="px-2 py-1.5 text-xs text-[#8A8F98] font-medium">
              Built-in Presets
            </div>
            {BUILTIN_PRESETS.map((preset) => (
              <SelectItem
                key={preset.id}
                value={preset.id}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>{preset.icon}</span>
                  <div>
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-[#8A8F98]">
                      {preset.description}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}

            {/* User presets */}
            {userPresets.length > 0 && (
              <>
                <div className="h-px bg-white/10 my-2" />
                <div className="px-2 py-1.5 text-xs text-[#8A8F98] font-medium">
                  My Presets
                </div>
                {userPresets.map((preset) => (
                  <div key={preset.id} className="flex items-center group">
                    <SelectItem
                      value={preset.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>{preset.icon}</span>
                        <div>
                          <div className="font-medium">{preset.name}</div>
                          <div className="text-xs text-[#8A8F98]">
                            {preset.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePreset(preset.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </SelectContent>
        </Select>

        {/* Save Current as Preset Button */}
        <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-[#8A8F98] hover:text-[#EDEDEF]"
              title="Save current settings as preset"
            >
              <Save className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-[#0F0F12] border-white/10">
            <div className="space-y-3">
              <div className="text-sm font-medium">Save as New Preset</div>
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Preset name..."
                className="bg-[#0a0a0c] border-white/10"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNewPreset()}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNewPreset}
                  className="flex-1 bg-[#5E6AD2] hover:bg-[#6872D9]"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSaveDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Current Preset Info */}
      {selectedPreset && (
        <div className="text-xs text-[#8A8F98] flex items-center gap-2">
          <Check className="w-3 h-3 text-green-500" />
          <span>
            {AUDIO_FORMATS[selectedPreset.targetFormat].description}
            {selectedPreset.bitrate && ` @ ${selectedPreset.bitrate}`}
          </span>
        </div>
      )}
    </div>
  );
}
