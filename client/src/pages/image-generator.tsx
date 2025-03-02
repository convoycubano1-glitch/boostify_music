import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function ImageGeneratorPage() {
  const [, setLocation] = useLocation();
  
  // Redirect to the new simplified Flux generator
  useEffect(() => {
    setLocation('/flux-generator');
  }, [setLocation]);
  
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 items-center justify-center">
        <h1 className="text-2xl font-bold">Redirecting...</h1>
        <p>Taking you to the new Flux AI generator.</p>
      </div>
    </div>
  );
}