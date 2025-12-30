
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import type { AudioFile } from '@/types';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface BatchRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: AudioFile[];
  onApply: (newTitles: Map<string, string>) => void;
}

export function BatchRenameModal({ isOpen, onClose, files, onApply }: BatchRenameModalProps) {
  const [findPattern, setFindPattern] = useState('');
  const [replacePattern, setReplacePattern] = useState('');
  const [previewLimit, setPreviewLimit] = useState(5);

  const debouncedFind = useDebounce(findPattern, 300);
  const debouncedReplace = useDebounce(replacePattern, 300);

  const { previewMap, error } = useMemo(() => {
    const map = new Map<string, string>();
    let err = '';

    if (!debouncedFind) return { previewMap: map, error: '' };

    try {
      const regex = new RegExp(debouncedFind, 'g'); // Global search usually desired for batch? Or just once per line? 'g' might replace multiple occurrences in one title. Let's assume standard behavior.

      files.forEach(f => {
        const original = f.metadata.title;
        const renamed = original.replace(regex, debouncedReplace);
        if (original !== renamed) {
          map.set(f.id, renamed);
        }
      });
    } catch (e) {
      err = 'Invalid Regular Expression';
    }

    return { previewMap: map, error: err };
  }, [files, debouncedFind, debouncedReplace]);

  const handleApply = () => {
    onApply(previewMap);
    onClose();
  };

  const previewItems = Array.from(previewMap.entries()).slice(0, previewLimit);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0F0F12] border-white/10 text-[#EDEDEF] max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch Rename Chapters</DialogTitle>
          <DialogDescription className="text-[#8A8F98]">
            Use Regular Expressions to rename multiple files at once.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Find (Regex)</Label>
              <Input
                value={findPattern}
                onChange={(e) => setFindPattern(e.target.value)}
                placeholder="^(\d+) - (.*)"
                className={cn(
                  "bg-[#0a0a0c] border-white/10 font-mono text-sm",
                  error && "border-red-500 focus:border-red-500"
                )}
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
            </div>
            <div className="space-y-2">
              <Label>Replace with</Label>
              <Input
                value={replacePattern}
                onChange={(e) => setReplacePattern(e.target.value)}
                placeholder="Chapter $1: $2"
                className="bg-[#0a0a0c] border-white/10 font-mono text-sm"
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[#8A8F98]">Preview ({previewMap.size} changes)</Label>
            </div>

            <div className="bg-[#0a0a0c] border border-white/10 rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2">
              {previewMap.size === 0 ? (
                <div className="text-center text-[#8A8F98] py-8 text-sm italic">
                  {findPattern ? 'No matches found' : 'Enter a pattern to see changes'}
                </div>
              ) : (
                <>
                  {previewItems.map(([id, newTitle]) => {
                    const original = files.find(f => f.id === id)?.metadata.title || '';
                    return (
                      <div key={id} className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center text-sm">
                        <div className="text-[#8A8F98] truncate text-right">{original}</div>
                        <ArrowRight className="w-4 h-4 text-[#5E6AD2] flex-shrink-0" />
                        <div className="text-[#EDEDEF] truncate font-medium">{newTitle}</div>
                      </div>
                    );
                  })}
                  {previewMap.size > previewLimit && (
                    <div className="text-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewLimit(l => l + 20)}
                        className="text-[#5E6AD2] hover:text-[#6872D9]"
                      >
                        Show more
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="hover:bg-white/5">
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!!error || previewMap.size === 0}
            className="bg-[#5E6AD2] hover:bg-[#6872D9] text-white"
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
