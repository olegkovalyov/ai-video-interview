'use client';

import { useState, useEffect } from 'react';
import { Search, Star, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  searchCandidates, 
  getExperienceLevelDisplay,
  type CandidateSearchResult,
  type ExperienceLevel,
  type ProficiencyLevel 
} from '@/lib/api/candidate-search';
import { listSkills, type Skill } from '@/lib/api/skills';
import { toast } from 'sonner';
import { InviteModal } from './InviteModal';

export function CandidateSearchTab() {
  const [candidates, setCandidates] = useState<CandidateSearchResult[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  // Filters
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minProficiency, setMinProficiency] = useState<ProficiencyLevel | ''>('');
  const [minYears, setMinYears] = useState<number | ''>('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>('');
  const [skillSearch, setSkillSearch] = useState('');

  // Filter skills by search
  const filteredSkills = availableSkills.filter(skill =>
    skill.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  // Invite modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSearchResult | null>(null);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await listSkills({ isActive: true, limit: 100 });
        setAvailableSkills(response.data);
      } catch (error) {
        toast.error('Failed to load skills');
      }
    };
    fetchSkills();
  }, []);

  const handleSearch = async (searchPage = 1) => {
    setLoading(true);
    setSearched(true);
    try {
      const response = await searchCandidates({
        skillIds: selectedSkills.length > 0 ? selectedSkills : undefined,
        minProficiency: minProficiency || undefined,
        minYears: minYears || undefined,
        experienceLevel: experienceLevel || undefined,
        page: searchPage,
        limit,
      });
      setCandidates(response.data);
      setPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
      
      if (response.data.length === 0 && searchPage === 1) {
        toast.info('No candidates found matching your criteria');
      } else if (searchPage === 1) {
        toast.success(`Found ${response.pagination.total} candidate${response.pagination.total !== 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      handleSearch(newPage);
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const getProficiencyStars = (level: ProficiencyLevel): number => {
    const map = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    return map[level];
  };

  const handleInviteClick = (candidate: CandidateSearchResult) => {
    setSelectedCandidate(candidate);
    setInviteModalOpen(true);
  };

  return (
    <>
      {/* Search Filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Skills Selection */}
            <div>
              <label className="block text-white font-medium mb-3">
                Filter by Skills <span className="text-white/50">(optional)</span>
              </label>
              {/* Skill Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-white/5 rounded-lg">
                {filteredSkills.map(skill => (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
                      ${selectedSkills.includes(skill.id)
                        ? 'bg-yellow-400 text-gray-900'
                        : 'bg-white/10 text-white hover:bg-white/20'
                      }
                    `}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
              <p className="text-white/60 text-sm mt-2">
                Selected: {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Min Proficiency */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Minimum Proficiency
                </label>
                <select
                  value={minProficiency}
                  onChange={(e) => setMinProficiency(e.target.value as ProficiencyLevel | '')}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 cursor-pointer"
                >
                  <option value="" className="bg-gray-800">Any Level</option>
                  <option value="beginner" className="bg-gray-800">Beginner</option>
                  <option value="intermediate" className="bg-gray-800">Intermediate</option>
                  <option value="advanced" className="bg-gray-800">Advanced</option>
                  <option value="expert" className="bg-gray-800">Expert</option>
                </select>
              </div>

              {/* Min Years */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Minimum Years
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={minYears}
                  onChange={(e) => setMinYears(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Any"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel | '')}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 cursor-pointer"
                >
                  <option value="" className="bg-gray-800">Any Level</option>
                  <option value="junior" className="bg-gray-800">Junior</option>
                  <option value="mid" className="bg-gray-800">Mid-level</option>
                  <option value="senior" className="bg-gray-800">Senior</option>
                  <option value="lead" className="bg-gray-800">Lead</option>
                </select>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => handleSearch()}
                disabled={loading}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 cursor-pointer"
              >
                {loading ? (
                  <>Searching...</>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Candidates
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <>
          <div className="mb-4 text-white/80">
            Found <span className="text-white font-semibold">{total}</span> candidate{total !== 1 ? 's' : ''}
            {totalPages > 1 && (
              <span className="ml-2">
                (page {page} of {totalPages})
              </span>
            )}
          </div>

          {candidates.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No candidates found</h3>
                <p className="text-white/70">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {candidates.map(candidate => {
                const expLevel = getExperienceLevelDisplay(candidate.experienceLevel);
                
                return (
                  <Card key={candidate.userId} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Avatar */}
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                            {candidate.fullName.split(' ').map(n => n[0]).join('')}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-white">{candidate.fullName}</h3>
                              <span className={`px-3 py-1 rounded text-sm font-bold ${expLevel.color} bg-white/20 border border-white/30`}>
                                {expLevel.label}
                              </span>
                            </div>
                            <p className="text-white/70 text-sm mb-4">{candidate.email}</p>

                            {/* Skills */}
                            <div>
                              <p className="text-white/70 text-sm mb-2">Skills:</p>
                              <div className="flex flex-wrap gap-2">
                                {(candidate.matchedSkills || []).map(skill => {
                                  const stars = getProficiencyStars(skill.proficiencyLevel);
                                  return (
                                    <div
                                      key={skill.skillId}
                                      className="px-3 py-2 bg-white/10 rounded-lg"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-white font-medium text-sm">{skill.skillName}</span>
                                        <div className="flex items-center gap-0.5">
                                          {[...Array(stars)].map((_, i) => (
                                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                          ))}
                                        </div>
                                        {skill.yearsOfExperience && (
                                          <span className="text-white/60 text-xs">
                                            {skill.yearsOfExperience} {skill.yearsOfExperience === 1 ? 'year' : 'years'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold cursor-pointer"
                            onClick={() => handleInviteClick(candidate)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`
                        w-10 h-10 rounded-lg font-medium transition-all cursor-pointer
                        ${page === pageNum 
                          ? 'bg-yellow-400 text-gray-900' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || loading}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Invite Modal */}
      <InviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        candidate={selectedCandidate}
      />
    </>
  );
}
