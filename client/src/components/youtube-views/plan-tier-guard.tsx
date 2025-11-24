import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface PlanTierGuardProps {
  requiredPlan: "basic" | "pro" | "premium";
  userSubscription: string | null;
  children: React.ReactNode;
  featureName: string;
}

const PLAN_HIERARCHY = {
  "basic": 1,
  "pro": 2,
  "premium": 3,
};

const PLAN_NAMES = {
  "basic": "BASIC ($59.99/mo)",
  "pro": "PRO ($99.99/mo)",
  "premium": "PREMIUM ($149.99/mo)",
};

export function PlanTierGuard({
  requiredPlan,
  userSubscription,
  children,
  featureName,
}: PlanTierGuardProps) {
  const userPlanLevel = PLAN_HIERARCHY[userSubscription as keyof typeof PLAN_HIERARCHY] || 0;
  const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan];
  const hasAccess = userPlanLevel >= requiredPlanLevel;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-orange-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <Lock className="h-5 w-5" />
          {featureName} - Requires {PLAN_NAMES[requiredPlan]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-orange-300 font-semibold">Feature Locked</p>
            <p className="text-xs text-orange-200/70 mt-1">
              You're currently on {userSubscription ? PLAN_NAMES[userSubscription as keyof typeof PLAN_NAMES] : "Free Plan"}. 
              Upgrade to {PLAN_NAMES[requiredPlan]} to unlock {featureName}.
            </p>
          </div>
        </div>
        <Link href="/pricing">
          <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
            View Subscription Plans
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
