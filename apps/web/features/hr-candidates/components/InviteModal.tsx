'use client';

import { useState, useEffect } from 'react';
import { X, Send, FileText, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { CandidateSearchResult } from '@/lib/api/candidate-search';

// Mock data - will be replaced with real API calls
const mockTemplates = [
  { id: '1', title: 'Frontend Developer Interview', questionsCount: 5 },
  { id: '2', title: 'Backend Engineer Interview', questionsCount: 8 },
  { id: '3', title: 'Full Stack Developer Interview', questionsCount: 10 },
  { id: '4', title: 'DevOps Engineer Interview', questionsCount: 6 },
];

const mockCompanies = [
  { id: '1', name: 'TechCorp Inc.', position: 'Senior Developer' },
  { id: '2', name: 'StartupXYZ', position: 'Lead Engineer' },
  { id: '3', name: 'BigTech Solutions', position: 'Software Architect' },
];

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  candidate: CandidateSearchResult | null;
}

export function InviteModal({ open, onClose, candidate }: InviteModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTemplate('');
      setSelectedCompany('');
    }
  }, [open]);

  if (!open || !candidate) return null;

  const handleSubmit = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    if (!selectedCompany) {
      toast.error('Please select a company');
      return;
    }

    setIsSubmitting(true);
    
    // Mock API call - will be replaced with real invitation API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const template = mockTemplates.find(t => t.id === selectedTemplate);
    const company = mockCompanies.find(c => c.id === selectedCompany);
    
    toast.success(`Interview invitation sent to ${candidate.fullName}`, {
      description: `Template: ${template?.title} • Company: ${company?.name}`,
    });
    
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl border border-white/20 shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Invite to Interview</h2>
            <p className="text-white/70 text-sm mt-1">Send interview invitation to {candidate.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Candidate Info */}
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {candidate.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-white font-semibold">{candidate.fullName}</h3>
              <p className="text-white/60 text-sm">{candidate.email}</p>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-3">
              <FileText className="w-4 h-4" />
              Interview Template <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 cursor-pointer"
            >
              <option value="" className="bg-gray-800">Select a template...</option>
              {mockTemplates.map(template => (
                <option key={template.id} value={template.id} className="bg-gray-800">
                  {template.title} ({template.questionsCount} questions)
                </option>
              ))}
            </select>
          </div>

          {/* Company Selection */}
          <div>
            <label className="flex items-center gap-2 text-white font-medium mb-3">
              <Building2 className="w-4 h-4" />
              Company <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 cursor-pointer"
            >
              <option value="" className="bg-gray-800">Select a company...</option>
              {mockCompanies.map(company => (
                <option key={company.id} value={company.id} className="bg-gray-800">
                  {company.name} — {company.position}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-white/5">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-white/20 text-white hover:bg-white/10 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedTemplate || !selectedCompany}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold cursor-pointer"
          >
            {isSubmitting ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
