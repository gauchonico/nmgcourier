import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Save, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiGetEarningsConfig, apiUpdateEarningsConfig } from "@/lib/api";

export default function EarningsConfig() {
  const { toast } = useToast();
  const [config,     setConfig]     = useState<any>(null);
  const [percentage, setPercentage] = useState<number>(20);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    apiGetEarningsConfig().then((c) => {
      setConfig(c);
      setPercentage(parseFloat(c?.percentage) || 20);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!config) return;
    if (percentage < 1 || percentage > 100) {
      toast({ title: "Invalid percentage", description: "Must be between 1 and 100.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiUpdateEarningsConfig(config.id, percentage);
      toast({ title: "Saved!", description: `Rider earnings updated to ${percentage}%.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Earnings Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">Set the percentage riders earn from each delivered shipment</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading config...</p>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-secondary" /> Rider Commission Rate
                </CardTitle>
                <CardDescription>
                  This percentage applies to all riders across all countries. Changes take effect immediately on new deliveries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Commission Percentage (%)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number" min={1} max={100} value={percentage}
                      onChange={(e) => setPercentage(parseFloat(e.target.value))}
                      className="max-w-[120px] text-lg font-bold"
                    />
                    <span className="text-2xl font-bold text-secondary">%</span>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Preview Examples</p>
                  {[5000, 25000, 75000, 150000].map((price) => (
                    <div key={price} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipment worth {price.toLocaleString()}</span>
                      <span className="font-medium text-secondary">
                        → {Math.round(price * (percentage / 100)).toLocaleString()} rider earns
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <p>Earnings are calculated and updated automatically when a shipment status is changed to <strong>Delivered</strong> in the Shipment Board.</p>
                </div>

                <Button onClick={handleSave} disabled={saving}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Commission Rate"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {config?.updated_at && (
            <p className="text-xs text-muted-foreground text-center">
              Last updated: {new Date(config.updated_at).toLocaleString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}