"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Star,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  searchCandidates,
  getExperienceLevelDisplay,
  type CandidateSearchResult,
  type ExperienceLevel,
  type ProficiencyLevel,
} from "@/lib/api/candidate-search";
import { useSkills } from "@/lib/query/hooks/use-skills";
import { toast } from "sonner";
import { InviteModal } from "./InviteModal";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function CandidateSearchTab() {
  const [candidates, setCandidates] = useState<CandidateSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minProficiency, setMinProficiency] = useState<ProficiencyLevel | "">(
    "",
  );
  const [minYears, setMinYears] = useState<number | "">("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">(
    "",
  );
  const [skillSearch, setSkillSearch] = useState("");

  const hasActiveFilters =
    selectedSkills.length > 0 || minProficiency || minYears || experienceLevel;

  // Skills from React Query
  const { data: skillsData } = useSkills({ isActive: true, limit: 100 });
  const availableSkills = skillsData?.data ?? [];

  const filteredSkills = availableSkills.filter((skill) =>
    skill.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  // Invite modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateSearchResult | null>(null);

  const fetchCandidates = useCallback(
    async (fetchPage = 1) => {
      setLoading(true);
      try {
        const response = await searchCandidates({
          skillIds: selectedSkills.length > 0 ? selectedSkills : undefined,
          minProficiency: minProficiency || undefined,
          minYears: minYears || undefined,
          experienceLevel: experienceLevel || undefined,
          page: fetchPage,
          limit,
        });
        setCandidates(response.data);
        setPage(response.pagination.page);
        setTotalPages(response.pagination.totalPages);
        setTotal(response.pagination.total);
      } catch (error: any) {
        toast.error(error.message || "Failed to load candidates");
      } finally {
        setLoading(false);
      }
    },
    [selectedSkills, minProficiency, minYears, experienceLevel],
  );

  // Auto-load on mount
  useEffect(() => {
    fetchCandidates(1);
  }, [fetchCandidates]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchCandidates(newPage);
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId],
    );
  };

  const clearFilters = () => {
    setSelectedSkills([]);
    setMinProficiency("");
    setMinYears("");
    setExperienceLevel("");
    setSkillSearch("");
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
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {loading ? (
            "Loading..."
          ) : (
            <>
              <span className="text-foreground font-semibold">{total}</span>{" "}
              candidate{total !== 1 ? "s" : ""}
              {hasActiveFilters && " (filtered)"}
              {totalPages > 1 && (
                <span className="ml-1">
                  — page {page} of {totalPages}
                </span>
              )}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear filters
            </Button>
          )}
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="info" className="ml-2 px-1.5 py-0 text-xs">
                {(selectedSkills.length > 0 ? 1 : 0) +
                  (minProficiency ? 1 : 0) +
                  (minYears ? 1 : 0) +
                  (experienceLevel ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-5 space-y-5">
            {/* Skills Selection */}
            <div>
              <Label className="mb-2">
                Filter by Skills{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-muted/30">
                {filteredSkills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                      selectedSkills.includes(skill.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground hover:bg-accent border border-border"
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
                {filteredSkills.length === 0 && (
                  <p className="col-span-4 text-sm text-muted-foreground text-center py-4">
                    No skills found
                  </p>
                )}
              </div>
              {selectedSkills.length > 0 && (
                <p className="text-muted-foreground text-sm mt-2">
                  Selected: {selectedSkills.length} skill
                  {selectedSkills.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2">Minimum Proficiency</Label>
                <select
                  value={minProficiency}
                  onChange={(e) =>
                    setMinProficiency(e.target.value as ProficiencyLevel | "")
                  }
                  className={selectClass}
                >
                  <option value="">Any Level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <Label className="mb-2">Minimum Years</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={minYears}
                  onChange={(e) =>
                    setMinYears(e.target.value ? parseInt(e.target.value) : "")
                  }
                  placeholder="Any"
                />
              </div>

              <div>
                <Label className="mb-2">Experience Level</Label>
                <select
                  value={experienceLevel}
                  onChange={(e) =>
                    setExperienceLevel(e.target.value as ExperienceLevel | "")
                  }
                  className={selectClass}
                >
                  <option value="">Any Level</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-medium text-foreground mb-1">
            {hasActiveFilters
              ? "No candidates match your filters"
              : "No candidates registered yet"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your search criteria"
              : "Candidates will appear here after they register"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => {
            const expLevel = getExperienceLevelDisplay(
              candidate.experienceLevel,
            );

            return (
              <Card
                key={candidate.userId}
                className="transition-all hover:shadow-md hover:border-primary/30"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary flex-shrink-0">
                        {candidate.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-foreground">
                            {candidate.fullName}
                          </h3>
                          <Badge variant="info">{expLevel.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {candidate.email}
                        </p>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1.5">
                          {(candidate.matchedSkills || []).map((skill) => {
                            const stars = getProficiencyStars(
                              skill.proficiencyLevel,
                            );
                            return (
                              <div
                                key={skill.skillId}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md"
                              >
                                <span className="text-xs font-medium text-foreground">
                                  {skill.skillName}
                                </span>
                                <div className="flex items-center gap-0.5">
                                  {[...Array(stars)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className="w-3 h-3 text-warning fill-current"
                                    />
                                  ))}
                                </div>
                                {skill.yearsOfExperience && (
                                  <span className="text-xs text-muted-foreground">
                                    {skill.yearsOfExperience}y
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <Button
                      size="sm"
                      onClick={() => handleInviteClick(candidate)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
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
                  className={`w-9 h-9 rounded-md text-sm font-medium transition-all cursor-pointer ${
                    page === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  } disabled:opacity-50`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || loading}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
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
