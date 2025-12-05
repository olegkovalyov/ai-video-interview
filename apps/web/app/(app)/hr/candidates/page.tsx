'use client';

import { useState } from 'react';
import { Users, Search, Send, CheckCircle } from 'lucide-react';
import { CandidateSearchTab } from '@/features/hr-candidates/components/CandidateSearchTab';
import { CandidateInvitedTab } from '@/features/hr-candidates/components/CandidateInvitedTab';
import { CandidateCompletedTab } from '@/features/hr-candidates/components/CandidateCompletedTab';

type TabType = 'search' | 'invited' | 'completed';

export default function HRCandidatesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('search');

  const tabs = [
    { id: 'search' as TabType, label: 'Search', icon: Search, count: null },
    { id: 'invited' as TabType, label: 'Invited', icon: Send, count: 5 },
    { id: 'completed' as TabType, label: 'Completed', icon: CheckCircle, count: 12 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-10 h-10 text-white" />
            <h1 className="text-4xl font-bold text-white">Candidates</h1>
          </div>
          <p className="text-lg text-white/80">
            Search candidates, manage invitations, and review completed interviews
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20 w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all cursor-pointer
                    ${activeTab === tab.id
                      ? 'bg-yellow-400 text-gray-900 shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`
                      px-2 py-0.5 text-xs rounded-full
                      ${activeTab === tab.id
                        ? 'bg-yellow-600 text-white'
                        : 'bg-white/20 text-white'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'search' && <CandidateSearchTab />}
        {activeTab === 'invited' && <CandidateInvitedTab />}
        {activeTab === 'completed' && <CandidateCompletedTab />}
      </main>
    </div>
  );
}
