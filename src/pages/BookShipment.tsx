import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, MapPin, User, Phone, Mail, Weight, ChevronLeft, Copy, CheckCircle2, AlertTriangle, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "react-router-dom";
import { apiGetAreas, apiCreateShipment, apiGetInlandPricing, apiGetCrossBorderPricing } from "@/lib/api";
import type { Country, VehicleType, ShipmentStatus } from "@/lib/mock-data";

const countryOptions: { value: Country; label: string; flag: string }[] = [
  { value: "Kenya", label: "Kenya", flag: "🇰🇪" },
  { value: "Uganda", label: "Uganda", flag: "🇺🇬" },
  { value: "Tanzania", label: "Tanzania", flag: "🇹🇿" },
];

const vehicleOptions: { value: VehicleType; label: string; description: string }[] = [
  { value: "Bike", label: "Bike", description: "Up to 10kg — fast city delivery" },
  { value: "Van", label: "Van", description: "Up to 100kg — medium loads" },
  { value: "Truck", label: "Truck", description: "100kg+ — bulk & heavy cargo" },
];

function generateTrackingId(country: Country): string {
  const codes: Record<Country, string> = { Kenya: "KE", Uganda: "UG", Tanzania: "TZ" };
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `NC-${codes[country]}-${year}-${seq}`;
}

interface Area {
  id: string;
  name: string;
  city: string;
  country: Country;
  zone: string;
}

interface PriceBreakdown {
  baseFee: number;
  weightFee: number;
  zoneMultiplier: number;
  total: number;
  currency: string;
  isCrossBorder: boolean;
}

const BookShipment = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "confirmed">("form");
  const [trackingId, setTrackingId] = useState("");

  // Areas
  const [pickupAreas, setPickupAreas] = useState<Area[]>([]);
  const [dropoffAreas, setDropoffAreas] = useState<Area[]>([]);
  const [pickupAreasLoading, setPickupAreasLoading] = useState(false);
  const [dropoffAreasLoading, setDropoffAreasLoading] = useState(false);

  // Pricing
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Form state
  const [pickupCountry, setPickupCountry] = useState<Country | "">("");
  const [dropoffCountry, setDropoffCountry] = useState<Country | "">("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [pickupAreaId, setPickupAreaId] = useState("");
  const [dropoffAreaId, setDropoffAreaId] = useState("");
  const [weight, setWeight] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType | "">("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [notes, setNotes] = useState("");

  const pickupArea = pickupAreas.find((a) => a.id === pickupAreaId);
  const dropoffArea = dropoffAreas.find((a) => a.id === dropoffAreaId);
  const isCrossBorder = pickupCountry !== dropoffCountry && pickupCountry !== "" && dropoffCountry !== "";

  // inside BookShipment component, after all useState declarations:
const [searchParams] = useSearchParams();

useEffect(() => {
  const pc = searchParams.get("pickupCountry")  as Country | null;
  const dc = searchParams.get("dropoffCountry") as Country | null;
  const vt = searchParams.get("vehicleType")    as VehicleType | null;
  const w  = searchParams.get("weight");
  const pa = searchParams.get("pickupAreaId");
  const da = searchParams.get("dropoffAreaId");

  if (pc) setPickupCountry(pc);
  if (dc) setDropoffCountry(dc);
  if (vt) setVehicleType(vt);
  if (w)  setWeight(w);
  // Areas will auto-load via the existing useEffect hooks
  // Store area IDs to set after areas load
  if (pa) setTimeout(() => setPickupAreaId(pa),  800);
  if (da) setTimeout(() => setDropoffAreaId(da), 800);
}, []);

  // Load pickup areas
  useEffect(() => {
    if (!pickupCountry) { setPickupAreas([]); return; }
    setPickupAreasLoading(true);
    setPickupAreaId("");
    apiGetAreas(pickupCountry)
      .then((data) => { setPickupAreas(data || []); setPickupAreasLoading(false); });
  }, [pickupCountry]);

  // Load dropoff areas
  useEffect(() => {
    if (!dropoffCountry) { setDropoffAreas([]); return; }
    setDropoffAreasLoading(true);
    setDropoffAreaId("");
    apiGetAreas(dropoffCountry)
      .then((data) => { setDropoffAreas(data || []); setDropoffAreasLoading(false); });
  }, [dropoffCountry]);

  // Recalculate price whenever relevant fields change
  useEffect(() => {
    const w = parseFloat(weight);
    if (!vehicleType || !weight || isNaN(w) || w <= 0 || !pickupCountry || !dropoffCountry) {
      setPriceBreakdown(null);
      return;
    }

    const calculate = async () => {
      setPriceLoading(true);
      try {
        if (isCrossBorder) {
          const pricing = await apiGetCrossBorderPricing(
            pickupCountry as Country,
            dropoffCountry as Country,
            vehicleType as VehicleType
          );
          if (!pricing) { setPriceBreakdown(null); return; }
          const weightFee = pricing.per_kg_rate * w;
          const total = pricing.base_fee + weightFee;
          setPriceBreakdown({
            baseFee: pricing.base_fee,
            weightFee,
            zoneMultiplier: 1,
            total,
            currency: pricing.currency,
            isCrossBorder: true,
          });
        } else {
          const pricing = await apiGetInlandPricing(
            pickupCountry as Country,
            vehicleType as VehicleType
          );
          if (!pricing) { setPriceBreakdown(null); return; }
          const zone = dropoffArea?.zone || "city";
          const multiplierMap: Record<string, number> = {
            city: pricing.zone_multiplier_city,
            suburb: pricing.zone_multiplier_suburb,
            upcountry: pricing.zone_multiplier_upcountry,
          };
          const multiplier = multiplierMap[zone] || 1;
          const weightFee = pricing.per_kg_rate * w;
          const total = Math.round((pricing.base_fee + weightFee) * multiplier);
          setPriceBreakdown({
            baseFee: pricing.base_fee,
            weightFee: Math.round(weightFee),
            zoneMultiplier: multiplier,
            total,
            currency: pricing.currency,
            isCrossBorder: false,
          });
        }
      } finally {
        setPriceLoading(false);
      }
    };

    calculate();
  }, [vehicleType, weight, pickupCountry, dropoffCountry, dropoffArea, isCrossBorder]);

  const isValid =
    pickupCountry && dropoffCountry &&
    senderName.trim() && senderPhone.trim() &&
    pickupAreaId && dropoffAreaId &&
    receiverName.trim() && receiverPhone.trim() &&
    weight && parseFloat(weight) > 0 && vehicleType &&
    priceBreakdown !== null;

  const handleSubmit = async () => {
    if (!isValid || !pickupCountry || !dropoffCountry || !pickupArea || !dropoffArea || !priceBreakdown) return;
    const id = generateTrackingId(pickupCountry as Country);

    try {
      await apiCreateShipment({
        id: crypto.randomUUID(),
        tracking_id: id,
        sender: senderName,
        receiver: receiverName,
        origin: pickupArea.name,
        destination: dropoffArea.name,
        country: pickupCountry as Country,
        pickup_country: pickupCountry,
        dropoff_country: dropoffCountry,
        is_cross_border: isCrossBorder,
        status: "Pending" as ShipmentStatus,
        weight: parseFloat(weight),
        price: priceBreakdown.total,
        created_at: new Date().toISOString().split("T")[0],
      });
      setTrackingId(id);
      setStep("confirmed");
      toast({ title: "Shipment booked!", description: `Tracking ID: ${id}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const copyTrackingId = () => {
    navigator.clipboard.writeText(trackingId);
    toast({ title: "Copied!", description: "Tracking ID copied to clipboard." });
  };

  const resetForm = () => {
    setStep("form"); setTrackingId("");
    setPickupCountry(""); setDropoffCountry("");
    setSenderName(""); setSenderPhone(""); setSenderEmail("");
    setPickupAreaId(""); setDropoffAreaId("");
    setReceiverName(""); setReceiverPhone("");
    setWeight(""); setVehicleType(""); setNotes("");
    setPriceBreakdown(null);
  };

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <Card className="shadow-elevated text-center">
            <CardContent className="pt-10 pb-8 px-8">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Shipment Booked!</h2>
              <p className="text-muted-foreground text-sm mb-6">Share the tracking ID with your recipient.</p>
              <div className="bg-muted rounded-lg p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Tracking ID</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-heading text-xl font-bold text-foreground tracking-wide">{trackingId}</span>
                  <button onClick={copyTrackingId} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-left bg-muted/50 rounded-lg p-4 mb-6 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From</span>
                  <span className="font-medium">{countryOptions.find(c => c.value === pickupCountry)?.flag} {pickupArea?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-medium">{countryOptions.find(c => c.value === dropoffCountry)?.flag} {dropoffArea?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">{weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium">{vehicleType}</span>
                </div>
                {priceBreakdown && (
                  <>
                    <div className="border-t border-border pt-2 mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Base fee</span>
                        <span>{priceBreakdown.baseFee.toLocaleString()} {priceBreakdown.currency}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Weight fee ({weight}kg)</span>
                        <span>{priceBreakdown.weightFee.toLocaleString()} {priceBreakdown.currency}</span>
                      </div>
                      {!isCrossBorder && priceBreakdown.zoneMultiplier !== 1 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Zone ({dropoffArea?.zone})</span>
                          <span>× {priceBreakdown.zoneMultiplier}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 mt-1">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="font-bold text-secondary text-lg">{priceBreakdown.total.toLocaleString()} {priceBreakdown.currency}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/"><ChevronLeft className="h-4 w-4 mr-1" /> Home</Link>
                </Button>
                <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold" onClick={resetForm}>
                  Book Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-primary border-b border-primary">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Package className="h-7 w-7 text-secondary" />
            <span className="font-heading text-xl font-bold text-primary-foreground tracking-tight">Nation Courier</span>
          </Link>
          <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" asChild>
            <Link to="/"><ChevronLeft className="h-4 w-4 mr-1" /> Back to Home</Link>
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Book a Shipment</h1>
            <p className="text-muted-foreground">Fill in the details below and get an instant price. We operate across Kenya 🇰🇪, Uganda 🇺🇬, and Tanzania 🇹🇿.</p>
          </div>

          {/* Shipment Details */}
          <Card className="shadow-card mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Shipment Details</CardTitle>
              <CardDescription>Select locations, vehicle type, and package weight to get an instant price.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Vehicle & Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicleOptions.map((v) => (
                        <SelectItem key={v.value} value={v.value}>{v.label} — {v.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" min="0.1" step="0.1" placeholder="e.g. 5.0" value={weight} onChange={(e) => setWeight(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>

              {/* Pickup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success" /> Pickup Country
                  </Label>
                  <Select value={pickupCountry} onValueChange={(v) => setPickupCountry(v as Country)}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.flag} {c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success" /> Pickup Area
                  </Label>
                  <Select value={pickupAreaId} onValueChange={setPickupAreaId} disabled={!pickupCountry || pickupAreasLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={!pickupCountry ? "Select country first" : pickupAreasLoading ? "Loading..." : "Select area"} />
                    </SelectTrigger>
                    <SelectContent>
                      {pickupAreas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name} <span className="text-xs text-muted-foreground capitalize">({a.zone})</span></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dropoff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-destructive" /> Drop-off Country
                  </Label>
                  <Select value={dropoffCountry} onValueChange={(v) => setDropoffCountry(v as Country)}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.flag} {c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-destructive" /> Drop-off Area
                  </Label>
                  <Select value={dropoffAreaId} onValueChange={setDropoffAreaId} disabled={!dropoffCountry || dropoffAreasLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={!dropoffCountry ? "Select country first" : dropoffAreasLoading ? "Loading..." : "Select area"} />
                    </SelectTrigger>
                    <SelectContent>
                      {dropoffAreas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name} <span className="text-xs text-muted-foreground capitalize">({a.zone})</span></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cross-border warning */}
              <AnimatePresence>
                {isCrossBorder && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-3 bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                    <AlertTriangle className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Cross-border Shipment</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pickupCountry} → {dropoffCountry}. Cross-border rates apply.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live Price Breakdown */}
              <AnimatePresence>
                {priceLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Calculator className="h-4 w-4 animate-pulse" /> Calculating price...
                  </motion.div>
                )}
                {!priceLoading && priceBreakdown && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-secondary" /> Price Breakdown
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Base fee ({vehicleType})</span>
                        <span>{priceBreakdown.baseFee.toLocaleString()} {priceBreakdown.currency}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Weight fee ({weight}kg × {isCrossBorder ? "cross-border rate" : "per kg"})</span>
                        <span>{priceBreakdown.weightFee.toLocaleString()} {priceBreakdown.currency}</span>
                      </div>
                      {!isCrossBorder && priceBreakdown.zoneMultiplier !== 1 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Zone multiplier ({dropoffArea?.zone})</span>
                          <span>× {priceBreakdown.zoneMultiplier}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-foreground border-t border-secondary/30 pt-2 mt-1">
                        <span>Total</span>
                        <span className="text-secondary text-lg">{priceBreakdown.total.toLocaleString()} {priceBreakdown.currency}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Sender */}
          <Card className="shadow-card mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-success" />
                </div>
                Sender (Pickup)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="John Mwangi" value={senderName} onChange={(e) => setSenderName(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="+256 7XX XXX XXX" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="john@example.com" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className="pl-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receiver */}
          <Card className="shadow-card mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-destructive" />
                </div>
                Receiver (Drop-off)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Alice Nalubega" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="+256 7XX XXX XXX" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="shadow-card mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Additional Notes</CardTitle>
              <CardDescription>Any special handling instructions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="e.g. Fragile items, call before delivery..." value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[80px]" />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              size="lg"
              disabled={!isValid}
              onClick={handleSubmit}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold px-10"
            >
              <Package className="h-5 w-5 mr-2" />
              Book Shipment
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookShipment;