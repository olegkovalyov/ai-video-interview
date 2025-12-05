'use client';

import { useState, useEffect } from 'react';
import { CandidateSkillsTable } from './CandidateSkillsTable';
import { EditSkillForm } from './EditSkillForm';
import { ExperienceLevelSelector } from './ExperienceLevelSelector';
import { 
  getMyCandidateSkills, 
  removeMyCandidateSkill,
  type CandidateSkillsByCategory,
  type CandidateSkill,
  type ExperienceLevel
} from '@/lib/api/candidate-skills';
import { toast } from 'sonner';

export function CandidateSkillsList() {
  const [skillsByCategory, setSkillsByCategory] = useState<CandidateSkillsByCategory[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState<Set<string>>(new Set());
  const [editingSkill, setEditingSkill] = useState<CandidateSkill | null>(null);

  // Fetch skills and profile (aggregated response from API)
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getMyCandidateSkills();
      setSkillsByCategory(response.skills);
      setExperienceLevel(response.experienceLevel);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load your profile');
    } finally {
      setLoading(false);
    }
  };

  // Alias for refreshing
  const fetchSkills = fetchData;

  useEffect(() => {
    fetchData();
  }, []);

  // Row-level locking helper
  const withSkillLock = async <T,>(skillId: string, action: () => Promise<T>): Promise<T | void> => {
    setLoadingSkills(prev => new Set(prev).add(skillId));
    try {
      const result = await action();
      await fetchSkills(); // Refresh data
      return result;
    } catch (error: any) {
      console.error('Operation failed:', error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoadingSkills(prev => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    }
  };

  // Handle edit
  const handleEdit = (skillId: string) => {
    const skill = skillsByCategory
      .flatMap(cat => cat.skills)
      .find(s => s.skillId === skillId);
    
    if (skill) {
      setEditingSkill(skill);
    }
  };

  // Handle remove
  const handleRemove = async (skillId: string) => {
    const skill = skillsByCategory
      .flatMap(cat => cat.skills)
      .find(s => s.skillId === skillId);
    
    if (!skill) return;

    if (!confirm(`Remove "${skill.skillName}" from your profile?`)) {
      return;
    }

    await withSkillLock(skillId, async () => {
      await removeMyCandidateSkill(skillId);
      toast.success('Skill removed');
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/80">Loading your skills...</div>
      </div>
    );
  }

  // Calculate totals
  const totalSkills = skillsByCategory.reduce((sum, cat) => sum + cat.skills.length, 0);

  return (
    <>
      {/* Experience Level Selector */}
      <ExperienceLevelSelector 
        currentLevel={experienceLevel}
        onUpdate={(level) => setExperienceLevel(level)}
      />

      {/* Edit Skill Form */}
      {editingSkill && (
        <EditSkillForm
          skill={editingSkill}
          onClose={() => setEditingSkill(null)}
          onSuccess={() => {
            setEditingSkill(null);
            fetchSkills();
          }}
        />
      )}

      {/* Summary */}
      <div className="mb-6 text-white/80">
        You have <span className="text-white font-semibold">{totalSkills}</span> skill{totalSkills !== 1 ? 's' : ''} across{' '}
        <span className="text-white font-semibold">{skillsByCategory.length}</span> categor{skillsByCategory.length !== 1 ? 'ies' : 'y'}
      </div>

      {/* Skills by Category */}
      {skillsByCategory.length === 0 ? (
        <CandidateSkillsTable
          skills={[]}
          onEdit={handleEdit}
          onRemove={handleRemove}
          loadingSkills={loadingSkills}
        />
      ) : (
        <div className="space-y-8">
          {skillsByCategory.map(category => (
            <div key={category.categoryId}>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-yellow-400 rounded"></span>
                {category.categoryName}
                <span className="text-white/50 text-base font-normal ml-2">
                  ({category.skills.length} skill{category.skills.length !== 1 ? 's' : ''})
                </span>
              </h2>
              <CandidateSkillsTable
                skills={category.skills}
                onEdit={handleEdit}
                onRemove={handleRemove}
                loadingSkills={loadingSkills}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
