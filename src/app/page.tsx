"use client";

import { useAppStore } from '@/lib/store';
import { LoginForm } from '@/components/login-form';

export default function Home() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        <LoginForm />
      </div>
    </main>
  );
}
