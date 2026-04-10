"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Shield } from "lucide-react";

const KEYCLOAK_URL =
  process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8090";
const KEYCLOAK_REALM =
  process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "ai-video-interview";
const CLIENT_ID = "ai-video-interview-app";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_WEB_ORIGIN ||
  "http://localhost:3000";

export default function SecurityPage() {
  const createAIAUrl = (action: string, redirectPath: string) => {
    const authUrl = new URL(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`,
    );
    authUrl.searchParams.append("client_id", CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", `${APP_URL}${redirectPath}`);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", "openid profile email");
    authUrl.searchParams.append("kc_action", action);
    return authUrl.toString();
  };

  const handlePasswordChange = () => {
    const url = createAIAUrl(
      "UPDATE_PASSWORD",
      "/profile?success=password_changed",
    );
    window.location.href = url;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-start gap-6 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Change Password
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Update your account password to keep your account secure. You will
              be redirected to a secure page.
            </p>
            <Button variant="default" size="sm" onClick={handlePasswordChange}>
              <Key className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-4 p-6">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Secure Account Management
            </h3>
            <p className="text-sm text-blue-700">
              All security settings are managed through our secure identity
              provider with industry-standard encryption.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
