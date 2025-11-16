'use client';

import { useState, useEffect } from 'react';
import { X, Save, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listSkills, type Skill } from '@/lib/api/skills';
import { addMyCandidateSkill, type ProficiencyLevel } from '@/lib/api/candidate-skills';
import { toast } from 'sonner';

interface AddSkillFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSkillForm({ onClose, onSuccess }: AddSkillFormProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    skillId: '',
    proficiencyLevel: 'intermediate' as ProficiencyLevel,
    yearsOfExperience: 1,
    description: '',
  });

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const response = await listSkills({ isActive: true, limit: 100 });
        setSkills(response.data);
        const firstSkill = response.data[0];
        if (firstSkill) {
          setFormData(prev => ({ ...prev, skillId: firstSkill.id }));
        }
      } catch (error) {
        toast.error('Failed to load skills');
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.skillId) {
      toast.error('Please select a skill');
      return;
    }

    setSaving(true);
    try {
      await addMyCandidateSkill(formData);
      toast.success('Skill added successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add skill');
    } finally {
      setSaving(false);
    }
  };

  const getProficiencyStars = (level: ProficiencyLevel): number => {
    const map = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    return map[level];
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
        <CardContent className="p-6">
          <div className="text-white/80 text-center py-4">Loading skills...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Add New Skill</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Skill Selection */}
          <div>
            <label className="block text-white font-medium mb-2">
              Skill <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.skillId}
              onChange={(e) => setFormData(prev => ({ ...prev, skillId: e.target.value }))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 cursor-pointer"
              required
            >
              {skills.map(skill => (
                <option key={skill.id} value={skill.id} className="bg-gray-800">
                  {skill.name} ({skill.categoryName})
                </option>
              ))}
            </select>
          </div>

          {/* Proficiency Level */}
          <div>
            <label className="block text-white font-medium mb-2">
              Proficiency Level <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.proficiencyLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, proficiencyLevel: e.target.value as ProficiencyLevel }))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 cursor-pointer"
              required
            >
              <option value="beginner" className="bg-gray-800">
                ⭐ Beginner (1 star)
              </option>
              <option value="intermediate" className="bg-gray-800">
                ⭐⭐ Intermediate (2 stars)
              </option>
              <option value="advanced" className="bg-gray-800">
                ⭐⭐⭐ Advanced (3 stars)
              </option>
              <option value="expert" className="bg-gray-800">
                ⭐⭐⭐⭐ Expert (4 stars)
              </option>
            </select>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(4)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < getProficiencyStars(formData.proficiencyLevel)
                        ? 'text-yellow-400 fill-current'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/70 text-sm capitalize">
                {formData.proficiencyLevel}
              </span>
            </div>
          </div>

          {/* Years of Experience */}
          <div>
            <label className="block text-white font-medium mb-2">
              Years of Experience <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={formData.yearsOfExperience}
              onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tell us about your experience with this skill..."
              rows={3}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Add Skill
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
