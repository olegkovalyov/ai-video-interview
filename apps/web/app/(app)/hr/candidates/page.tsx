"use client";

import { useState } from "react";
import { Search, Clock, CheckCircle } from "lucide-react";
import { CandidateSearchTab } from "@/features/hr-candidates/components/CandidateSearchTab";
import { CandidateInvitedTab } from "@/features/hr-candidates/components/CandidateInvitedTab";
import { CandidateCompletedTab } from "@/features/hr-candidates/components/CandidateCompletedTab";

type Tab = "search" | "invited" | "completed";

const tabs = [
  { id: "search" as Tab, label: "Search", icon: Search },
  { id: "invited" as Tab, label: "Invited", icon: Clock },
  { id: "completed" as Tab, label: "Completed", icon: CheckCircle },
];

export default function CandidatesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("search");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Candidates
        </h1>
        <p className="text-sm text-muted-foreground">
          Search, invite, and track candidate interviews
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "search" && <CandidateSearchTab />}
      {activeTab === "invited" && <CandidateInvitedTab />}
      {activeTab === "completed" && <CandidateCompletedTab />}
    </div>
  );
}
