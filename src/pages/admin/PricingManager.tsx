import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Save, RefreshCw, Pencil, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type VehicleType = "Bike" | "Van" | "Truck";
type Country = "Kenya" | "Uganda" | "Tanzania";

interface InlandRate {
  id: string;
  country: Country;
  vehicle_type: VehicleType;
  currency: string;
  base_fee: number;
  per_kg_rate: number;
  zone_multiplier_city: number;
  zone_multiplier_suburb: number;
  zone_multiplier_upcountry: number;
}

interface CrossBorderRate {
  id: string;
  from_country: Country;
  to_country: Country;
  vehicle_type: VehicleType;
  currency: string;
  base_fee: number;
  per_kg_rate: number;
}

const countryFlag: Record<Country, string> = {
  Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿",
};

const vehicleColors: Record<VehicleType, string> = {
  Bike: "bg-success/10 text-success",
  Van: "bg-secondary/10 text-secondary-foreground",
  Truck: "bg-primary/10 text-primary",
};

export default function PricingManager() {
  const { toast } = useToast();
  const [inlandRates, setInlandRates] = useState<InlandRate[]>([]);
  const [crossBorderRates, setCrossBorderRates] = useState<CrossBorderRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInland, setEditingInland] = useState<string | null>(null);
  const [editingCross, setEditingCross] = useState<string | null>(null);
  const [inlandEdits, setInlandEdits] = useState<Partial<InlandRate>>({});
  const [crossEdits, setCrossEdits] = useState<Partial<CrossBorderRate>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: inland }, { data: cross }] = await Promise.all([
      supabase.from("pricing_inland").select("*").order("country").order("vehicle_type"),
      supabase.from("pricing_crossborder").select("*").order("from_country").order("vehicle_type"),
    ]);
    setInlandRates((inland as InlandRate[]) || []);
    setCrossBorderRates((cross as CrossBorderRate[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Inland editing ──────────────────────────────────
  const startInlandEdit = (rate: InlandRate) => {
    setEditingInland(rate.id);
    setInlandEdits({ ...rate });
  };

  const cancelInlandEdit = () => {
    setEditingInland(null);
    setInlandEdits({});
  };

  const saveInlandEdit = async () => {
    if (!editingInland) return;
    setSaving(true);
    const { error } = await supabase
      .from("pricing_inland")
      .update({
        base_fee: inlandEdits.base_fee,
        per_kg_rate: inlandEdits.per_kg_rate,
        zone_multiplier_city: inlandEdits.zone_multiplier_city,
        zone_multiplier_suburb: inlandEdits.zone_multiplier_suburb,
        zone_multiplier_upcountry: inlandEdits.zone_multiplier_upcountry,
      })
      .eq("id", editingInland);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Rate updated!", description: "Inland pricing has been saved." });
    cancelInlandEdit();
    load();
  };

  // ── Cross-border editing ────────────────────────────
  const startCrossEdit = (rate: CrossBorderRate) => {
    setEditingCross(rate.id);
    setCrossEdits({ ...rate });
  };

  const cancelCrossEdit = () => {
    setEditingCross(null);
    setCrossEdits({});
  };

  const saveCrossEdit = async () => {
    if (!editingCross) return;
    setSaving(true);
    const { error } = await supabase
      .from("pricing_crossborder")
      .update({
        base_fee: crossEdits.base_fee,
        per_kg_rate: crossEdits.per_kg_rate,
      })
      .eq("id", editingCross);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Rate updated!", description: "Cross-border pricing has been saved." });
    cancelCrossEdit();
    load();
  };

  const inlandField = (field: keyof InlandRate, label: string) => (
    editingInland === inlandEdits.id ? (
      <Input
        type="number"
        step="0.01"
        value={inlandEdits[field] as number}
        onChange={(e) => setInlandEdits((prev) => ({ ...prev, [field]: parseFloat(e.target.value) }))}
        className="h-7 w-24 text-xs px-2"
      />
    ) : <span>{(inlandEdits[field] ?? "") as string}</span>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Pricing Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage inland and cross-border delivery rates</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Loading rates...</p>
      ) : (
        <>
          {/* Inland Pricing */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary" /> Inland Rates
              </CardTitle>
              <CardDescription>
                Same-country delivery pricing. Formula: (Base Fee + Weight × Per KG Rate) × Zone Multiplier
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Base Fee</TableHead>
                    <TableHead className="text-right">Per KG</TableHead>
                    <TableHead className="text-right">City ×</TableHead>
                    <TableHead className="text-right">Suburb ×</TableHead>
                    <TableHead className="text-right">Upcountry ×</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inlandRates.map((rate, i) => {
                    const isEditing = editingInland === rate.id;
                    const data = isEditing ? inlandEdits : rate;
                    return (
                      <motion.tr
                        key={rate.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className={`border-b transition-colors ${isEditing ? "bg-secondary/5" : "hover:bg-muted/50"}`}
                      >
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            {countryFlag[rate.country]} {rate.country}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${vehicleColors[rate.vehicle_type]}`}>
                            {rate.vehicle_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{rate.currency}</TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input type="number" value={inlandEdits.base_fee} onChange={(e) => setInlandEdits(p => ({ ...p, base_fee: parseFloat(e.target.value) }))} className="h-7 w-28 text-xs px-2 ml-auto" />
                          ) : <span className="text-sm font-mono">{rate.base_fee.toLocaleString()}</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input type="number" value={inlandEdits.per_kg_rate} onChange={(e) => setInlandEdits(p => ({ ...p, per_kg_rate: parseFloat(e.target.value) }))} className="h-7 w-24 text-xs px-2 ml-auto" />
                          ) : <span className="text-sm font-mono">{rate.per_kg_rate.toLocaleString()}</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input type="number" step="0.1" value={inlandEdits.zone_multiplier_city} onChange={(e) => setInlandEdits(p => ({ ...p, zone_multiplier_city: parseFloat(e.target.value) }))} className="h-7 w-20 text-xs px-2 ml-auto" />
                          ) : <span className="text-sm">{rate.zone_multiplier_city}×</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input type="number" step="0.1" value={inlandEdits.zone_multiplier_suburb} onChange={(e) => setInlandEdits(p => ({ ...p, zone_multiplier_suburb: parseFloat(e.target.value) }))} className="h-7 w-20 text-xs px-2 ml-auto" />
                          ) : <span className="text-sm">{rate.zone_multiplier_suburb}×</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input type="number" step="0.1" value={inlandEdits.zone_multiplier_upcountry} onChange={(e) => setInlandEdits(p => ({ ...p, zone_multiplier_upcountry: parseFloat(e.target.value) }))} className="h-7 w-20 text-xs px-2 ml-auto" />
                          ) : <span className="text-sm">{rate.zone_multiplier_upcountry}×</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={cancelInlandEdit} className="h-7 w-7 p-0">
                                <X className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                              <Button size="sm" onClick={saveInlandEdit} disabled={saving} className="h-7 w-7 p-0 bg-success hover:bg-success/90">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => startInlandEdit(rate)} className="h-7 w-7 p-0">
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Cross-border Pricing */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Cross-Border Rates
              </CardTitle>
              <CardDescription>
                Between-country delivery pricing. Formula: Base Fee + (Weight × Per KG Rate)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Base Fee</TableHead>
                    <TableHead className="text-right">Per KG</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crossBorderRates.map((rate, i) => {
                    const isEditing = editingCross === rate.id;
                    return (
                      <motion.tr
                        key={rate.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className={`border-b transition-colors ${isEditing ? "bg-secondary/5" : "hover:bg-muted/50"}`}
                      >
                        <TableCell>
                          <span className="text-sm font-medium flex items-center gap-1">
                            {countryFlag[rate.from_country]} {rate.from_country}
                            <span className="text-muted-foreground mx-1">→</span>
                            {countryFlag[rate.to_country]} {rate.to_country}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${vehicleColors[rate.vehicle_type]}`}>
                            {rate.vehicle_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{rate.currency}</TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input type="number" value={crossEdits.base_fee} onChange={(e) => setCrossEdits(p => ({ ...p, base_fee: parseFloat(e.target.value) }))} className="h-7 w-28 text-xs px-2 ml-auto" />
                          ) : <span className="text-sm font-mono">{rate.base_fee.toLocaleString()}</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input type="number" value={crossEdits.per_kg_rate} onChange={(e) => setCrossEdits(p => ({ ...p, per_kg_rate: parseFloat(e.target.value) }))} className="h-7 w-24 text-xs px-2 ml-auto" />
                          ) : <span className="text-sm font-mono">{rate.per_kg_rate.toLocaleString()}</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={cancelCrossEdit} className="h-7 w-7 p-0">
                                <X className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                              <Button size="sm" onClick={saveCrossEdit} disabled={saving} className="h-7 w-7 p-0 bg-success hover:bg-success/90">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => startCrossEdit(rate)} className="h-7 w-7 p-0">
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}