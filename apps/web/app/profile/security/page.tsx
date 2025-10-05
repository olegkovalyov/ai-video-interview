"use client";

import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Key, ExternalLink, Smartphone, Activity } from 'lucide-react';
import Link from 'next/link';

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8090';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'ai-video-interview';
const CLIENT_ID = 'ai-video-interview-app';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000';

export default function SecurityPage() {
  const ACCOUNT_BASE = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/account`;

  // Функция для создания AIA URL
  const createAIAUrl = (action: string, redirectPath: string) => {
    const authUrl = new URL(`${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`);
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', `${APP_URL}${redirectPath}`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid profile email');
    authUrl.searchParams.append('kc_action', action);
    return authUrl.toString();
  };

  const handlePasswordChange = () => {
    const url = createAIAUrl('UPDATE_PASSWORD', '/profile?success=password_changed');
    window.location.href = url;
  };

  const securityOptions = [
    {
      title: 'Change Password',
      description: 'Update your account password securely',
      icon: Key,
      action: handlePasswordChange,
      color: 'blue',
      useAIA: true,
    },
    {
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      icon: Smartphone,
      url: `${ACCOUNT_BASE}/#/security/signingin`,
      color: 'purple',
      useAIA: false,
    },
    {
      title: 'Device Activity',
      description: 'Manage active sessions and device history',
      icon: Activity,
      url: `${ACCOUNT_BASE}/#/security/device-activity`,
      color: 'green',
      useAIA: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header />
      
      <main className="container mx-auto px-6 py-12">
        {/* Back Button */}
        <Link 
          href="/profile"
          className="inline-flex items-center text-white/90 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Profile
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <Shield className="w-10 h-10 mr-3" />
            Security Settings
          </h1>
          <p className="text-white/70">Manage your password and security preferences</p>
        </div>

        {/* Security Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {securityOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card 
                key={option.title}
                onClick={option.useAIA ? option.action : undefined}
                className={`bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-200 group ${
                  option.useAIA ? 'cursor-pointer' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg bg-${option.color}-500/20 border border-${option.color}-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 text-${option.color}-300`} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {option.title}
                  </h3>
                  
                  <p className="text-white/70 text-sm mb-4">
                    {option.description}
                  </p>
                  
                  {option.useAIA ? (
                    <div className="inline-flex items-center text-white/90 text-sm font-medium group-hover:translate-x-1 transition-transform pointer-events-none">
                      Manage
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </div>
                  ) : (
                    <a
                      href={option.url}
                      className="inline-flex items-center text-white/90 hover:text-white text-sm font-medium group-hover:translate-x-1 transition-transform cursor-pointer"
                    >
                      Manage
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="mt-8 max-w-6xl">
          <Card className="bg-blue-500/10 backdrop-blur-md border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Secure Account Management
                  </h3>
                  <p className="text-white/80 text-sm">
                    All security settings are managed through our secure identity provider (Keycloak). 
                    This ensures your account credentials and sensitive security settings are protected 
                    with industry-standard security practices and encryption.
                  </p>
                  <p className="text-white/70 text-sm mt-2">
                    When you click on any option above, you'll be redirected to a secure page with our 
                    custom theme that matches the application's design.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
