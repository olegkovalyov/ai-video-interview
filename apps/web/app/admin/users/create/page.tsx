"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Candidate',
    sendWelcomeEmail: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await apiPost('/admin/users', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Creating user:', formData);
      
      // Redirect to users list
      router.push('/admin/users');
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      setIsCreating(false);
    }
  };

  const isFormValid = () => {
    return formData.firstName.trim() && 
           formData.lastName.trim() && 
           formData.email.trim() &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Back Button */}
        <Link 
          href="/admin/users"
          className="inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users</span>
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
            <UserPlus className="w-10 h-10" />
            <span>Create New User</span>
          </h1>
          <p className="text-lg text-white/80">
            Add a new user to the system
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName" className="text-white/80">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        placeholder="John"
                        className="mt-2 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName" className="text-white/80">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Doe"
                        className="mt-2 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="email" className="text-white/80">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john.doe@example.com"
                        className="mt-2 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      />
                      <p className="text-xs text-white/60 mt-1">
                        User will receive login credentials via email
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="role" className="text-white/80">
                        Role *
                      </Label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white h-9"
                      >
                        <option value="Candidate">Candidate</option>
                        <option value="HR">HR Manager</option>
                        <option value="Admin">Administrator</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                      <p className="text-xs text-white/60 mt-1">
                        Determines user permissions and access level
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Additional Options</h2>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="sendWelcomeEmail"
                        checked={formData.sendWelcomeEmail}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-400 bg-white/10 border-white/30 rounded focus:ring-blue-400 focus:ring-2"
                      />
                      <span className="text-white/80">Send welcome email with login instructions</span>
                    </label>
                  </div>
                </div>

                {/* Role Descriptions */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/20">
                  <h3 className="text-sm font-semibold text-white mb-3">Role Descriptions:</h3>
                  <div className="space-y-2 text-xs text-white/70">
                    <div><strong className="text-white/90">Candidate:</strong> Can take interviews and view their own results</div>
                    <div><strong className="text-white/90">HR Manager:</strong> Can create interviews, view candidates, and manage hiring process</div>
                    <div><strong className="text-white/90">Administrator:</strong> Full system access including user management</div>
                    <div><strong className="text-white/90">Viewer:</strong> Read-only access to interviews and analytics</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-white/20">
                  <Link href="/admin/users">
                    <Button type="button" variant="glass">
                      Cancel
                    </Button>
                  </Link>
                  
                  <Button 
                    type="submit" 
                    variant="brand"
                    disabled={!isFormValid() || isCreating}
                    className="flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isCreating ? 'Creating User...' : 'Create User'}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
