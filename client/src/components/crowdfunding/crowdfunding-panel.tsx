import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/use-auth";
import { Heart, TrendingUp, DollarSign, Users, Loader2, Save, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface CrowdfundingCampaign {
  id: number;
  userId: number;
  title: string;
  description?: string;
  goalAmount: string;
  currentAmount: string;
  isActive: boolean;
  contributorsCount: number;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Contribution {
  id: number;
  campaignId: number;
  contributorName?: string;
  contributorEmail?: string;
  isAnonymous: boolean;
  amount: string;
  platformFee: string;
  artistAmount: string;
  message?: string;
  paymentStatus: string;
  createdAt: string;
}

interface CrowdfundingPanelProps {
  colors: {
    hexAccent: string;
    hexPrimary: string;
    hexBorder: string;
  };
}

export function CrowdfundingPanel({ colors }: CrowdfundingPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<CrowdfundingCampaign | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("Support My Next Single");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("1000");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    loadCampaignData();
  }, []);

  const loadCampaignData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Load campaign
      const campaignResponse = await fetch('/api/crowdfunding/my-campaign', {
        credentials: 'include',
      });
      const campaignData = await campaignResponse.json();

      if (campaignData.success && campaignData.campaign) {
        const camp = campaignData.campaign;
        setCampaign(camp);
        setTitle(camp.title);
        setDescription(camp.description || "");
        setGoalAmount(camp.goalAmount);
        setIsActive(camp.isActive);

        // Load contributions
        const contributionsResponse = await fetch(`/api/crowdfunding/contributions/${camp.id}`, {
          credentials: 'include',
        });
        const contributionsData = await contributionsResponse.json();

        if (contributionsData.success) {
          setContributions(contributionsData.contributions || []);
        }
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!goalAmount || parseFloat(goalAmount) <= 0) {
      toast({
        title: "Invalid Goal",
        description: "Please enter a valid goal amount",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/crowdfunding/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          goalAmount: parseFloat(goalAmount),
          isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Campaign Saved",
          description: "Your crowdfunding campaign has been updated successfully",
        });
        await loadCampaignData();
      } else {
        throw new Error(data.message || 'Failed to save campaign');
      }
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save campaign",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateProgress = () => {
    if (!campaign) return 0;
    const current = parseFloat(campaign.currentAmount || '0');
    const goal = parseFloat(campaign.goalAmount || '0');
    return goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  };

  const calculateEarnings = () => {
    const totalRaised = parseFloat(campaign?.currentAmount || '0');
    const platformFee = totalRaised * 0.30;
    const artistEarnings = totalRaised * 0.70;
    return { totalRaised, platformFee, artistEarnings };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.hexPrimary }} />
      </div>
    );
  }

  const progress = calculateProgress();
  const earnings = calculateEarnings();

  return (
    <div className="space-y-6 p-6 bg-gray-950 rounded-lg border" style={{ borderColor: colors.hexBorder }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6" style={{ color: colors.hexAccent }} />
          <h2 className="text-2xl font-bold text-white">Crowdfunding Campaign</h2>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="active-toggle" className="text-gray-400">
            {isActive ? "Active" : "Inactive"}
          </Label>
          <Switch
            id="active-toggle"
            checked={isActive}
            onCheckedChange={setIsActive}
            style={{
              backgroundColor: isActive ? colors.hexPrimary : '#374151',
            }}
          />
        </div>
      </div>

      {/* Current Progress (if campaign exists) */}
      {campaign && (
        <div className="space-y-4 p-4 bg-gray-900 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <DollarSign className="h-4 w-4" />
                <span>Total Raised</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${earnings.totalRaised.toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <TrendingUp className="h-4 w-4" style={{ color: colors.hexAccent }} />
                <span>Your Earnings (70%)</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: colors.hexAccent }}>
                ${earnings.artistEarnings.toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Users className="h-4 w-4" />
                <span>Contributors</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {campaign.contributorsCount}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Progress</span>
              <span className="text-white font-semibold">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${colors.hexPrimary} 0%, ${colors.hexAccent} 100%)`,
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>${earnings.totalRaised.toFixed(0)} raised</span>
              <span>Goal: ${goalAmount}</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 p-2 bg-gray-800 rounded">
            💡 Platform fee (30%): ${earnings.platformFee.toFixed(2)}
          </div>
        </div>
      )}

      {/* Campaign Configuration */}
      <div className="space-y-4">
        <div>
          <Label className="text-white">Campaign Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Support My Next Single"
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div>
          <Label className="text-white">Description (optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell your fans what you're working on..."
            className="bg-gray-900 border-gray-700 text-white resize-none"
            rows={3}
          />
        </div>

        <div>
          <Label className="text-white">Goal Amount (USD)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="number"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              placeholder="1000"
              className="pl-10 bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-6 text-lg font-bold"
          style={{
            background: `linear-gradient(135deg, ${colors.hexPrimary} 0%, ${colors.hexAccent} 100%)`,
            color: 'white',
          }}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Save className="h-5 w-5" />
              Save Changes
            </span>
          )}
        </Button>
      </div>

      {/* Recent Contributions */}
      {contributions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye className="h-5 w-5" style={{ color: colors.hexAccent }} />
            Recent Contributions
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {contributions.slice(0, 10).map((contribution) => (
              <div
                key={contribution.id}
                className="p-3 bg-gray-900 rounded-lg border border-gray-800"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-semibold text-white">
                      {contribution.isAnonymous ? 'Anonymous' : contribution.contributorName || 'Unknown'}
                    </div>
                    {contribution.message && (
                      <div className="text-sm text-gray-400 italic">
                        "{contribution.message}"
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {new Date(contribution.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: colors.hexAccent }}>
                      ${parseFloat(contribution.amount).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      You get: ${parseFloat(contribution.artistAmount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Notice */}
      <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-400">
        <p className="mb-2">
          <strong className="text-white">How it works:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Toggle to activate/deactivate your campaign anytime</li>
          <li>When active, a "Support" button appears on your public profile</li>
          <li>You receive 70% of each contribution, 30% platform fee</li>
          <li>Earnings are automatically added to your wallet</li>
        </ul>
      </div>
    </div>
  );
}
