"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Shield } from 'lucide-react';

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8090';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'ai-video-interview';
const CLIENT_ID = 'ai-video-interview-app';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000';

export default function SecurityPage() {
  // Create AIA URL for password change
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

  return (
    <div className="space-y-6">
      {/* Password Change Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border-2 border-blue-500/30 flex items-center justify-center">
                <Key className="w-8 h-8 text-blue-300" />
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                Change Password
              </h2>
              <p className="text-white/70 mb-6">
                Update your account password to keep your account secure. You will be redirected to a secure page to complete the process.
              </p>
              
              <Button
                variant="brand"
                onClick={handlePasswordChange}
                className="flex items-center gap-2"
                size="lg"
              >
                <Key className="w-5 h-5" />
                Change Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="bg-blue-500/10 backdrop-blur-md border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Secure Account Management
              </h3>
              <p className="text-white/80 text-sm">
                All security settings are managed through our secure identity provider with industry-standard encryption and security practices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
