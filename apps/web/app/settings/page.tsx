"use client";

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Bell, Shield, Palette, Download, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'data', label: 'Data & Privacy', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header />
      
      <main className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Settings
          </h1>
          <p className="text-lg text-white/80">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-0">
                <nav className="space-y-1 p-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all cursor-pointer ${
                          activeTab === tab.id
                            ? 'bg-white/20 text-white'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold text-white mb-6">Profile Information</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6 mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        JD
                      </div>
                      <div>
                        <Button variant="brand" size="sm" className="mr-3 cursor-pointer">
                          Change Avatar
                        </Button>
                        <Button variant="glass" size="sm" className="cursor-pointer">
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          defaultValue="John"
                          className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Doe"
                          className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue="john.doe@example.com"
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        defaultValue="Software engineer passionate about building scalable systems and mentoring junior developers."
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
                      />
                    </div>

                    <div className="pt-4">
                      <Button variant="brand" className="cursor-pointer">Save Changes</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold text-white mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Email Notifications</h3>
                      <div className="space-y-3">
                        {[
                          { id: 'new-candidates', label: 'New candidate applications', checked: true },
                          { id: 'interview-completed', label: 'Interview completions', checked: true },
                          { id: 'weekly-summary', label: 'Weekly summary report', checked: false },
                          { id: 'system-updates', label: 'System updates and maintenance', checked: true },
                        ].map((item) => (
                          <label key={item.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked={item.checked}
                              className="w-4 h-4 text-blue-400 bg-white/10 border-white/30 rounded focus:ring-blue-400 focus:ring-2"
                            />
                            <span className="text-white/80">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Push Notifications</h3>
                      <div className="space-y-3">
                        {[
                          { id: 'browser-notifications', label: 'Browser notifications', checked: true },
                          { id: 'mobile-notifications', label: 'Mobile app notifications', checked: false },
                        ].map((item) => (
                          <label key={item.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked={item.checked}
                              className="w-4 h-4 text-blue-400 bg-white/10 border-white/30 rounded focus:ring-blue-400 focus:ring-2"
                            />
                            <span className="text-white/80">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button variant="brand" className="cursor-pointer">Save Preferences</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold text-white mb-6">Security Settings</h2>
                  
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Password</h3>
                      <p className="text-white/70 mb-4">
                        Your password is managed through our authentication provider.
                      </p>
                      <Button variant="brand" className="cursor-pointer">Change Password</Button>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Two-factor authentication</p>
                          <p className="text-white/70 text-sm">Add an extra layer of security to your account</p>
                        </div>
                        <Button variant="glass" size="sm" className="cursor-pointer">Enable</Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Active Sessions</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-medium">Current session</p>
                            <p className="text-white/70 text-sm">Chrome on macOS • New York, NY</p>
                          </div>
                          <span className="text-green-300 text-sm">Active now</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'preferences' && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold text-white mb-6">Preferences</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Language
                      </label>
                      <select className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Timezone
                      </label>
                      <select className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer">
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="GMT">GMT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Date Format
                      </label>
                      <select className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer">
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div className="pt-4">
                      <Button variant="brand" className="cursor-pointer">Save Preferences</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'data' && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold text-white mb-6">Data & Privacy</h2>
                  
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Export Data</h3>
                      <p className="text-white/70 mb-4">
                        Download a copy of your data including interviews, candidates, and settings.
                      </p>
                      <Button variant="brand" className="flex items-center space-x-2 cursor-pointer">
                        <Download className="w-4 h-4" />
                        <span>Export My Data</span>
                      </Button>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Delete Account</h3>
                      <p className="text-white/70 mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button variant="destructive" className="flex items-center space-x-2 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Account</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
