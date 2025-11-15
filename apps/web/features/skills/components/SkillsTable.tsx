import { Edit2, Trash2, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skill } from '../types/skill.types';

interface SkillsTableProps {
  skills: Skill[];
  onToggleStatus: (skillId: string) => void;
  onEdit: (skillId: string) => void;
  onDelete: (skillId: string) => void;
  loadingSkills?: Set<string>;
}

export function SkillsTable({ 
  skills, 
  onToggleStatus, 
  onEdit, 
  onDelete, 
  loadingSkills = new Set() 
}: SkillsTableProps) {
  if (skills.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-12 text-center">
          <Wrench className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No skills found</h3>
          <p className="text-white/70">Try adjusting your filters or create a new skill</p>
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
                <th className="text-left p-4 text-white/70 font-semibold">Skill Name</th>
                <th className="text-left p-4 text-white/70 font-semibold">Category</th>
                <th className="text-left p-4 text-white/70 font-semibold">Description</th>
                <th className="text-center p-4 text-white/70 font-semibold">Status</th>
                <th className="text-center p-4 text-white/70 font-semibold">Users</th>
                <th className="text-right p-4 text-white/70 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => {
                const isLoading = loadingSkills.has(skill.id);
                return (
                  <tr 
                    key={skill.id}
                    className={`
                      border-b border-white/10 hover:bg-white/5 transition-all duration-200
                      ${isLoading ? 'opacity-60 blur-[0.5px]' : ''}
                    `}
                  >
                    {/* Skill Name */}
                    <td className="p-4">
                      <div className="text-white font-medium">{skill.name}</div>
                      <div className="text-white/50 text-xs">{skill.slug}</div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                        {skill.categoryName}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="p-4 text-white/80 text-sm max-w-xs truncate">
                      {skill.description || '—'}
                    </td>

                    {/* Status Toggle */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onToggleStatus(skill.id)}
                          disabled={isLoading}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                            ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                            ${skill.isActive ? 'bg-green-500' : 'bg-gray-600'}
                          `}
                          title={skill.isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${skill.isActive ? 'translate-x-6' : 'translate-x-1'}
                          `} />
                        </button>
                      </div>
                    </td>

                    {/* Candidates Count */}
                    <td className="p-4 text-center">
                      <span className="text-white/80 font-medium">
                        {skill.candidatesCount}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(skill.id)}
                          disabled={isLoading}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => onDelete(skill.id)}
                          disabled={isLoading}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
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
