import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-6xl font-extrabold text-primary">404</h1>
      <h2 className="text-2xl font-bold">Page Not Found</h2>
      <p className="text-muted-foreground max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
};
