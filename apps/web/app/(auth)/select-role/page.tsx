'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { toast } from 'sonner';
import { Briefcase, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Role = 'candidate' | 'hr';

export default function SelectRolePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectRole = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setIsSubmitting(true);
    console.log('🎯 [SELECT-ROLE] Step 1: Starting role selection...', { role: selectedRole });
    
    try {
      // Step 1: Assign role
      console.log('🎯 [SELECT-ROLE] Step 2: Calling /api/users/me/select-role...');
      const selectResponse = await apiPost('/api/users/me/select-role', { role: selectedRole });
      console.log('🎯 [SELECT-ROLE] Step 3: Role assigned successfully:', selectResponse);
      toast.success(`Role selected: ${selectedRole === 'hr' ? 'HR Manager' : 'Candidate'}`);
      
      // Step 2: Refresh token to get new JWT with updated role from Keycloak
      console.log('🎯 [SELECT-ROLE] Step 4: Refreshing token...');
      toast.info('Updating your session...');
      const refreshResponse = await apiPost('/auth/refresh');
      console.log('🎯 [SELECT-ROLE] Step 5: Token refreshed:', refreshResponse);
      
      // Step 3: Redirect to dashboard with updated role
      console.log('🎯 [SELECT-ROLE] Step 6: Redirecting to dashboard...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (error: any) {
      console.error('❌ [SELECT-ROLE] Error:', error);
      console.error('❌ [SELECT-ROLE] Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack,
      });
      toast.error(error.message || 'Failed to select role');
      setIsSubmitting(false);
    }
  };

  const roles = [
    {
      id: 'candidate' as Role,
      title: 'Candidate',
      description: 'Looking for job opportunities and ready to showcase my skills',
      icon: UserCheck,
      gradient: 'from-blue-500 to-cyan-500',
      features: [
        'Create your professional profile',
        'Take video interviews',
        'Track application status',
        'Receive interview feedback',
      ],
    },
    {
      id: 'hr' as Role,
      title: 'HR Manager',
      description: 'Recruiting talent and conducting interviews for my company',
      icon: Briefcase,
      gradient: 'from-purple-500 to-pink-500',
      features: [
        'Create interview templates',
        'Review candidate responses',
        'Manage hiring pipeline',
        'Collaborate with team',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome! 👋
          </h1>
          <p className="text-xl text-white/90 mb-2">
            Let's get you started
          </p>
          <p className="text-white/70">
            Choose your role to personalize your experience
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`
                  cursor-pointer transition-all duration-300 transform hover:scale-105
                  ${isSelected 
                    ? 'ring-4 ring-white/50 shadow-2xl bg-white/20' 
                    : 'bg-white/10 hover:bg-white/15'
                  }
                  backdrop-blur-md border-white/20
                `}
              >
                <CardContent className="p-8">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{role.title}</h2>
                      {isSelected && (
                        <span className="inline-block px-2 py-1 bg-green-500/30 text-green-200 text-xs rounded-full border border-green-400/50 mt-1">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/80 mb-6 leading-relaxed">
                    {role.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-white/70 text-sm">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSelectRole}
            disabled={!selectedRole || isSubmitting}
            className={`
              px-8 py-4 rounded-xl font-semibold text-lg
              transition-all duration-300 transform
              ${selectedRole && !isSubmitting
                ? 'bg-white text-indigo-600 hover:bg-white/90 hover:scale-105 shadow-xl cursor-pointer'
                : 'bg-white/20 text-white/50 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
