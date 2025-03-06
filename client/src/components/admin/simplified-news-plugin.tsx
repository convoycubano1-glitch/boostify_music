import React from 'react';
import { Card } from "@/components/ui/card";

export default function SimplifiedNewsPlugin() {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Music News Plugin</h2>
        <p className="text-sm text-muted-foreground">Manage music industry news</p>
      </div>
      
      <div className="space-y-4">
        <p>This is a simplified version of the Music News Plugin.</p>
        <p>The original plugin had stability issues and has been temporarily simplified.</p>
      </div>
    </Card>
  );
}