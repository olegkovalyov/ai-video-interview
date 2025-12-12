'use client';

import { useState, useEffect } from 'react';
import { X, Send, FileText, Building2, Calendar, Pause, Timer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { CandidateSearchResult } from '@/lib/api/candidate-search';
import { listTemplates } from '@/features/templates/services/templates-api';
import type { Template } from '@/features/templates/types/template.types';
import { listCompanies, type Company } from '@/lib/api/companies';
import { createInvitation } from '@/lib/api/invitations';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  candidate: CandidateSearchResult | null;
  onSuccess?: () => void;
}

export function InviteModal({ open, onClose, candidate, onSuccess }: InviteModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [allowPause, setAllowPause] = useState(true);
  const [showTimer, setShowTimer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data from API
  const [templates, setTemplates] = useState<Template[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load templates and companies when modal opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      
      // Set default expiration date (+7 days)
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7);
      setExpiresAt(defaultExpiry.toISOString().slice(0, 16)); // Format for datetime-local
      
      // Reset form
      setSelectedTemplate('');
      setSelectedCompany('');
      setAllowPause(true);
      setShowTimer(true);
      
      // Load data
      Promise.all([
        listTemplates(1, 100, { status: 'active' }).catch(() => ({ items: [] })),
        listCompanies({ limit: 100 }).catch(() => ({ data: [] })),
      ]).then(([templatesData, companiesData]) => {
        setTemplates(templatesData?.items || []);
        setCompanies(companiesData?.data || []);
        
        // Auto-select if only one company
        if (companiesData.data?.length === 1) {
          setSelectedCompany(companiesData.data[0].id);
        }
      }).finally(() => {
        setIsLoading(false);
      });
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
    if (!expiresAt) {
      toast.error('Please set a deadline');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const company = companies.find(c => c.id === selectedCompany);
      
      await createInvitation({
        templateId: selectedTemplate,
        candidateId: candidate.userId,
        companyName: company?.name || '',
        expiresAt: new Date(expiresAt).toISOString(),
        allowPause,
        showTimer,
      });
      
      const template = templates.find(t => t.id === selectedTemplate);
      
      toast.success(`Interview invitation sent to ${candidate.fullName}`, {
        description: `Template: ${template?.title} • Company: ${company?.name}`,
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create invitation';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
              <span className="ml-2 text-white/50">Loading...</span>
            </div>
          ) : (
            <>
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
                  disabled={templates.length === 0}
                >
                  <option value="" className="bg-gray-800">
                    {templates.length === 0 ? 'No active templates available' : 'Select a template...'}
                  </option>
                  {templates.map(template => (
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
                  disabled={companies.length === 0}
                >
                  <option value="" className="bg-gray-800">
                    {companies.length === 0 ? 'No companies available' : 'Select a company...'}
                  </option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id} className="bg-gray-800">
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="flex items-center gap-2 text-white font-medium mb-3">
                  <Calendar className="w-4 h-4" />
                  Deadline <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 cursor-pointer [color-scheme:dark]"
                />
                <p className="text-white/50 text-xs mt-1">Candidate must complete the interview before this date</p>
              </div>

              {/* Options */}
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPause}
                    onChange={(e) => setAllowPause(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-yellow-400 focus:ring-yellow-400/50 cursor-pointer"
                  />
                  <span className="flex items-center gap-2 text-white">
                    <Pause className="w-4 h-4" />
                    Allow Pause
                  </span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTimer}
                    onChange={(e) => setShowTimer(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-yellow-400 focus:ring-yellow-400/50 cursor-pointer"
                  />
                  <span className="flex items-center gap-2 text-white">
                    <Timer className="w-4 h-4" />
                    Show Timer
                  </span>
                </label>
              </div>
            </>
          )}
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
            disabled={isSubmitting || isLoading || !selectedTemplate || !selectedCompany || !expiresAt}
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
