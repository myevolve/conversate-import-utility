"use client";

import { LoginForm } from "@/components/login-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        <LoginForm />
      </div>
    </main>
  );
}
