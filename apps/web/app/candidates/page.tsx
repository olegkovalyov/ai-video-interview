"use client";

import Link from 'next/link';
import { Search, Filter, MoreVertical, Mail, Phone, MapPin, Star } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CandidatesPage() {
  // Mock data
  const candidates = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY',
      position: 'Frontend Developer',
      interview: 'Frontend Developer Interview',
      status: 'completed',
      score: 85,
      appliedAt: '2025-01-15',
      completedAt: '2025-01-18',
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1 (555) 987-6543',
      location: 'San Francisco, CA',
      position: 'Senior Backend Engineer',
      interview: 'Senior Backend Engineer',
      status: 'pending',
      score: null,
      appliedAt: '2025-01-20',
      completedAt: null,
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@email.com',
      phone: '+1 (555) 456-7890',
      location: 'Austin, TX',
      position: 'Product Manager',
      interview: 'Product Manager Assessment',
      status: 'completed',
      score: 92,
      appliedAt: '2025-01-12',
      completedAt: '2025-01-14',
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david.kim@email.com',
      phone: '+1 (555) 321-0987',
      location: 'Seattle, WA',
      position: 'Frontend Developer',
      interview: 'Frontend Developer Interview',
      status: 'in_progress',
      score: null,
      appliedAt: '2025-01-19',
      completedAt: null,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400/20 text-green-200 border-green-400/30';
      case 'in_progress':
        return 'bg-blue-400/20 text-blue-200 border-blue-400/30';
      case 'pending':
        return 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30';
      default:
        return 'bg-gray-400/20 text-gray-200 border-gray-400/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-300';
    if (score >= 75) return 'text-yellow-300';
    if (score >= 60) return 'text-orange-300';
    return 'text-red-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header />
      
      <main className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Candidates
          </h1>
          <p className="text-lg text-white/80">
            View and manage all candidate applications and interview results
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">47</div>
              <div className="text-sm text-white/80">Total Candidates</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">28</div>
              <div className="text-sm text-white/80">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">12</div>
              <div className="text-sm text-white/80">In Progress</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">7</div>
              <div className="text-sm text-white/80">Pending</div>
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
                  placeholder="Search candidates by name, email, position..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
                />
              </div>

              {/* Status Filter */}
              <select className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer">
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
              </select>

              {/* Interview Filter */}
              <select className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer">
                <option value="">All Interviews</option>
                <option value="frontend">Frontend Developer</option>
                <option value="backend">Backend Engineer</option>
                <option value="product">Product Manager</option>
              </select>

              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-lg flex items-center space-x-2 transition-colors cursor-pointer">
                <Filter className="w-5 h-5" />
                <span>More Filters</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer">
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white cursor-pointer hover:text-yellow-400 transition-colors">{candidate.name}</h3>
                      <p className="text-white/70 text-sm">{candidate.position}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(candidate.status)}`}
                        >
                          {candidate.status.replace('_', ' ')}
                        </span>
                        {candidate.score && (
                          <div className={`flex items-center space-x-1 ${getScoreColor(candidate.score)}`}>
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs font-semibold">{candidate.score}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="text-white/60 hover:text-white p-1 cursor-pointer">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-white/70">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{candidate.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/70">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{candidate.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/70">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{candidate.location}</span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <p className="text-white/70 text-sm mb-1">Interview: {candidate.interview}</p>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Applied: {candidate.appliedAt}</span>
                    {candidate.completedAt && (
                      <span>Completed: {candidate.completedAt}</span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button asChild variant="brand" size="sm" className="flex-1">
                    <Link href={`/candidates/${candidate.id}`}>View Profile</Link>
                  </Button>
                  {candidate.status === 'completed' && (
                    <Button asChild variant="glass" size="sm">
                      <Link href={`/candidates/${candidate.id}/results`}>Results</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">
                Showing 1 to 4 of 47 candidates
              </div>
              <div className="flex space-x-2">
                <Button variant="glass" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="brand" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
