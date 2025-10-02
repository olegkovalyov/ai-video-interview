"use client";

import Link from 'next/link';
import { Plus, Search, Filter, Play, Users, Calendar, MoreVertical } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function InterviewsPage() {
  // Mock data
  const interviews = [
    {
      id: '1',
      title: 'Frontend Developer Interview',
      description: 'React, TypeScript, and modern frontend development',
      status: 'active',
      candidates: 8,
      responses: 5,
      createdAt: '2025-01-15',
      duration: 45,
    },
    {
      id: '2',
      title: 'Senior Backend Engineer',
      description: 'Node.js, microservices, and system design',
      status: 'draft',
      candidates: 0,
      responses: 0,
      createdAt: '2025-01-18',
      duration: 60,
    },
    {
      id: '3',
      title: 'Product Manager Assessment',
      description: 'Strategy, roadmapping, and stakeholder management',
      status: 'completed',
      candidates: 12,
      responses: 12,
      createdAt: '2025-01-10',
      duration: 30,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header />
      
      <main className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Interviews
            </h1>
            <p className="text-lg text-white/80">
              Manage your AI-powered video interview templates
            </p>
          </div>
          <Button asChild variant="brand" size="lg">
            <Link href="/interviews/create" className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create Interview</span>
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">12</div>
              <div className="text-sm text-white/80">Total Interviews</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">8</div>
              <div className="text-sm text-white/80">Active</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">156</div>
              <div className="text-sm text-white/80">Total Candidates</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">89</div>
              <div className="text-sm text-white/80">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search interviews..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
                />
              </div>

              {/* Status Filter */}
              <select className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>

              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-lg flex items-center space-x-2 transition-colors cursor-pointer">
                <Filter className="w-5 h-5" />
                <span>More Filters</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Interviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviews.map((interview) => (
            <Card key={interview.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{interview.title}</h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          interview.status === 'active'
                            ? 'bg-green-400/20 text-green-200 border-green-400/30'
                            : interview.status === 'draft'
                            ? 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30'
                            : 'bg-blue-400/20 text-blue-200 border-blue-400/30'
                        }`}
                      >
                        {interview.status}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mb-4">{interview.description}</p>
                  </div>
                  <button className="text-white/60 hover:text-white p-1 cursor-pointer">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 flex-grow">
                  <div className="flex items-center space-x-2 text-white/70">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{interview.candidates} candidates</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/70">
                    <Play className="w-4 h-4" />
                    <span className="text-sm">{interview.responses} responses</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/70">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{interview.duration} min</span>
                  </div>
                  <div className="text-white/70 text-sm">
                    Created {interview.createdAt}
                  </div>
                </div>

                <div className="flex space-x-2 mt-auto">
                  <Button asChild variant="brand" size="sm" className="flex-1">
                    <Link href={`/interviews/${interview.id}`} className="cursor-pointer">View Details</Link>
                  </Button>
                  {interview.status === 'active' && (
                    <Button asChild variant="glass" size="sm" className="cursor-pointer">
                      <Link href={`/interviews/${interview.id}/candidates`}>
                        <Users className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State (if no interviews) */}
        {interviews.length === 0 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-6">🎯</div>
              <h3 className="text-2xl font-semibold text-white mb-4">No interviews yet</h3>
              <p className="text-white/80 mb-8 max-w-md mx-auto">
                Get started by creating your first AI-powered video interview template.
              </p>
              <Button asChild variant="brand" size="lg">
                <Link href="/interviews/create" className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Interview</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
