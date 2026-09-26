import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { apiClient } from "../lib/api-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Server, Database, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  service: string;
}

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [backendHealth, setBackendHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<HealthData>("/health")
      .then((res) => {
        setBackendHealth(res.data);
        setHealthError(null);
      })
      .catch((err) => {
        setHealthError(err.message || "Failed to reach backend");
      })
      .finally(() => {
        setLoadingHealth(false);
      });
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="text-center py-12 px-4 space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" />
          <span>Full Stack Architecture Ready</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          React + Supabase + Express
        </h1>
        <p className="text-lg text-muted-foreground">
          A production-ready full-stack boilerplate featuring Supabase Authentication, Node.js
          Express backend with centralized error handling, and Vite frontend with Tailwind CSS and
          Shadcn UI.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          {user ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-green-600">Logged in as {user.email}</p>
            </div>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Login
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Status Cards */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Backend API</CardTitle>
                <CardDescription>Express + TypeScript</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            {loadingHealth ? (
              <p className="text-muted-foreground">Checking backend status...</p>
            ) : backendHealth ? (
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-green-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Online: {backendHealth.status}
                </p>
                <p className="text-muted-foreground text-xs">
                  Uptime: {Math.floor(backendHealth.uptime)}s
                </p>
                <p className="text-muted-foreground text-xs">Env: {backendHealth.environment}</p>
              </div>
            ) : (
              <p className="text-destructive font-medium">{healthError}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Database & Auth</CardTitle>
                <CardDescription>Supabase Platform</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">
              Connected via{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                @supabase/supabase-js
              </code>
              . Configure your project URL and keys in{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">.env</code>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Architecture</CardTitle>
                <CardDescription>Clean & Modular</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Strict separation with Controllers, Services, Middlewares, AppError handlers, and path
            aliasing across both frontend and backend.
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
