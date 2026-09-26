import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../components/common/Header";

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Built with React, Supabase, and Express following clean enterprise architecture.
      </footer>
    </div>
  );
};
