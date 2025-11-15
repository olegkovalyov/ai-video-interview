import { Edit2, Trash2, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CandidateSkill, ProficiencyLevel } from '../types/candidate-skill.types';

interface CandidateSkillsTableProps {
  skills: CandidateSkill[];
  onEdit: (skillId: string) => void;
  onRemove: (skillId: string) => void;
  loadingSkills?: Set<string>;
}

const getProficiencyStars = (level: ProficiencyLevel): number => {
  const map = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
  return map[level];
};

const getProficiencyColor = (level: ProficiencyLevel): string => {
  const map = {
    beginner: 'text-yellow-400',
    intermediate: 'text-blue-400',
    advanced: 'text-purple-400',
    expert: 'text-green-400',
  };
  return map[level];
};

export function CandidateSkillsTable({ 
  skills, 
  onEdit, 
  onRemove, 
  loadingSkills = new Set() 
}: CandidateSkillsTableProps) {
  if (skills.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-12 text-center">
          <Star className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No skills added yet</h3>
          <p className="text-white/70">Add your first skill to showcase your expertise</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/20">
              <tr>
                <th className="text-left p-4 text-white/70 font-semibold">Skill</th>
                <th className="text-left p-4 text-white/70 font-semibold">Proficiency</th>
                <th className="text-center p-4 text-white/70 font-semibold">Experience</th>
                <th className="text-left p-4 text-white/70 font-semibold">Description</th>
                <th className="text-right p-4 text-white/70 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => {
                const isLoading = loadingSkills.has(skill.skillId);
                const stars = getProficiencyStars(skill.proficiencyLevel);
                const starColor = getProficiencyColor(skill.proficiencyLevel);
                
                return (
                  <tr 
                    key={skill.skillId}
                    className={`
                      border-b border-white/10 hover:bg-white/5 transition-all duration-200
                      ${isLoading ? 'opacity-60 blur-[0.5px]' : ''}
                    `}
                  >
                    {/* Skill Name */}
                    <td className="p-4">
                      <div className="text-white font-medium">{skill.skillName}</div>
                      <div className="text-white/50 text-xs">{skill.categoryName}</div>
                    </td>

                    {/* Proficiency */}
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {[...Array(4)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < stars ? `${starColor} fill-current` : 'text-white/20'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-white/70 text-xs mt-1 capitalize">
                        {skill.proficiencyLevel}
                      </div>
                    </td>

                    {/* Years of Experience */}
                    <td className="p-4 text-center">
                      <span className="text-white font-medium">
                        {skill.yearsOfExperience} year{skill.yearsOfExperience !== 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="p-4 text-white/80 text-sm max-w-xs truncate">
                      {skill.description || '—'}
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(skill.skillId)}
                          disabled={isLoading}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => onRemove(skill.skillId)}
                          disabled={isLoading}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
