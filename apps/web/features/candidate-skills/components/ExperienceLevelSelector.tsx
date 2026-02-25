'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Check } from 'lucide-react';
import { 
  updateMyExperienceLevel, 
  getExperienceLevelDisplay,
  type ExperienceLevel 
} from '@/lib/api/candidate-skills';
import { toast } from 'sonner';

interface ExperienceLevelSelectorProps {
  currentLevel: ExperienceLevel | null;
  onUpdate: (level: ExperienceLevel) => void;
}

const EXPERIENCE_LEVELS: { value: ExperienceLevel; description: string }[] = [
  { value: 'junior', description: '0-2 years' },
  { value: 'mid', description: '2-5 years' },
  { value: 'senior', description: '5-10 years' },
  { value: 'lead', description: '10+ years' },
];

export function ExperienceLevelSelector({ currentLevel, onUpdate }: ExperienceLevelSelectorProps) {
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<ExperienceLevel | null>(currentLevel);

  const handleSelect = async (level: ExperienceLevel) => {
    if (level === selected) return;
    
    setSaving(true);
    try {
      await updateMyExperienceLevel(level);
      setSelected(level);
      onUpdate(level);
      toast.success('Experience level updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update experience level');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Briefcase className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Your Experience Level</h3>
          <span className="text-white/50 text-sm">(Optional)</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EXPERIENCE_LEVELS.map(({ value, description }) => {
            const display = getExperienceLevelDisplay(value);
            const isSelected = selected === value;
            
            return (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                disabled={saving}
                className={`
                  relative p-4 rounded-lg border transition-all cursor-pointer
                  ${isSelected 
                    ? 'bg-yellow-400/20 border-yellow-400 ring-2 ring-yellow-400/50' 
                    : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40'
                  }
                  ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-yellow-400" />
                  </div>
                )}
                <div className={`font-semibold ${isSelected ? 'text-yellow-400' : display.color}`}>
                  {display.label}
                </div>
                <div className="text-white/50 text-sm mt-1">
                  {description}
                </div>
              </button>
            );
          })}
        </div>
        
        {!selected && (
          <p className="text-white/50 text-sm mt-4">
            Select your experience level to help recruiters find you
          </p>
        )}
      </CardContent>
    </Card>
  );
}
