"use client";

import { useState } from "react";
import { CandidateSkillsList } from "@/features/candidate-skills";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddSkillForm } from "@/features/candidate-skills/components/AddSkillForm";

export default function ProfileSkillsPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      {showAddForm && (
        <AddSkillForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            window.location.reload();
          }}
        />
      )}

      <CandidateSkillsList />
    </>
  );
}
