'use client';

import { useState } from 'react';
import { CandidateSkillsList } from '@/features/candidate-skills';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddSkillForm } from '@/features/candidate-skills/components/AddSkillForm';

export default function ProfileSkillsPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <>
      {/* Action Button */}
      <div className="mb-6 flex justify-end">
        <Button 
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="w-4 h-4" />
          Add Skill
        </Button>
      </div>

      {/* Add Skill Form */}
      {showAddForm && (
        <AddSkillForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            window.location.reload(); // Refresh to show new skill
          }}
        />
      )}

      {/* Skills List Component */}
      <CandidateSkillsList />
    </>
  );
}
