import React from 'react';
import { Card } from "@/components/ui/card";

export default function TestComponent() {
  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold">Test Component</h2>
      <p className="mt-2">This is a simple test component to verify React rendering.</p>
    </Card>
  );
}