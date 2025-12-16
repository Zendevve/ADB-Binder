import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={stepNum} className="flex items-center gap-2">
            {/* Step Dot */}
            <motion.div
              className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300",
                isCompleted && "bg-[#5E6AD2] border-[#5E6AD2]",
                isCurrent && "border-[#5E6AD2] bg-[#5E6AD2]/20",
                !isCompleted && !isCurrent && "border-white/20 bg-white/5"
              )}
              initial={false}
              animate={{
                scale: isCurrent ? 1 : 0.9,
                boxShadow: isCurrent
                  ? '0 0 20px rgba(94, 106, 210, 0.4), 0 0 40px rgba(94, 106, 210, 0.2)'
                  : 'none'
              }}
              transition={{ duration: 0.3 }}
            >
              {isCompleted ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <span className={cn(
                  "text-xs font-semibold",
                  isCurrent ? "text-[#5E6AD2]" : "text-white/40"
                )}>
                  {stepNum}
                </span>
              )}
            </motion.div>

            {/* Label */}
            <span className={cn(
              "text-sm font-medium hidden sm:block",
              isCurrent ? "text-[#EDEDEF]" : "text-[#8A8F98]"
            )}>
              {labels[i]}
            </span>

            {/* Connector Line */}
            {stepNum < totalSteps && (
              <div className="w-8 h-[2px] mx-2">
                <motion.div
                  className="h-full bg-[#5E6AD2] origin-left"
                  initial={false}
                  animate={{
                    scaleX: isCompleted ? 1 : 0,
                    backgroundColor: isCompleted ? '#5E6AD2' : 'rgba(255,255,255,0.1)'
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
