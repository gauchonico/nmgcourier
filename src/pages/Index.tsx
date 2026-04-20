import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, MapPin, Search, Truck, Shield, Clock, ChevronRight, Phone, Mail, Calculator, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import heroCourier from "@/assets/hero-courier.jpg";
import { apiTrackShipment, apiGetAreas, apiGetInlandPricing, apiGetCrossBorderPricing } from "@/lib/api";

const services = [
  { icon: Truck,  title: "Same-Day Delivery",  description: "Fast delivery across Kampala and surrounding areas within hours." },
  { icon: Shield, title: "Secure Handling",    description: "Every parcel insured and handled with care from pickup to delivery." },
  { icon: Clock,  title: "Real-Time Tracking", description: "Track your package every step of the way with live status updates." },
];

const statusSteps = ["Pending", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];

type Country     = "Kenya" | "Uganda" | "Tanzania";
type VehicleType = "Bike" | "Van" | "Truck";

const countryOptions: { value: Country; label: string; flag: string }[] = [
  { value: "Kenya",    label: "Kenya",    flag: "🇰🇪" },
  { value: "Uganda",   label: "Uganda",   flag: "🇺🇬" },
  { value: "Tanzania", label: "Tanzania", flag: "🇹🇿" },
];

const vehicleOptions: { value: VehicleType; label: string; desc: string }[] = [
  { value: "Bike",  label: "Bike",  desc: "Up to 10kg"  },
  { value: "Van",   label: "Van",   desc: "Up to 100kg" },
  { value: "Truck", label: "Truck", desc: "100kg+"      },
];

interface Area {
  id: string; name: string; city: string; country: Country; zone: string;
}

interface PriceBreakdown {
  baseFee: number; weightFee: number; zoneMultiplier: number;
  total: number; currency: string; isCrossBorder: boolean;
}

const Index = () => {
  const navigate = useNavigate();

  // Tracking
  const [trackingId,      setTrackingId]      = useState("");
  const [trackedShipment, setTrackedShipment] = useState<any>(null);
  const [trackingError,   setTrackingError]   = useState("");
  const [isTracking,      setIsTracking]      = useState(false);

  // Quote
  const [pickupCountry,  setPickupCountry]  = useState<Country | "">("");
  const [dropoffCountry, setDropoffCountry] = useState<Country | "">("");
  const [pickupAreaId,   setPickupAreaId]   = useState("");
  const [dropoffAreaId,  setDropoffAreaId]  = useState("");
  const [pickupAreas,    setPickupAreas]    = useState<Area[]>([]);
  const [dropoffAreas,   setDropoffAreas]   = useState<Area[]>([]);
  const [pickupLoading,  setPickupLoading]  = useState(false);
  const [dropoffLoading, setDropoffLoading] = useState(false);
  const [vehicleType,    setVehicleType]    = useState<VehicleType | "">("");
  const [weight,         setWeight]         = useState("");
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [priceLoading,   setPriceLoading]   = useState(false);

  const pickupArea  = pickupAreas.find((a) => a.id === pickupAreaId);
  const dropoffArea = dropoffAreas.find((a) => a.id === dropoffAreaId);
  const isCrossBorder = pickupCountry !== dropoffCountry && !!pickupCountry && !!dropoffCountry;

  // Load pickup areas
  useEffect(() => {
    if (!pickupCountry) { setPickupAreas([]); setPickupAreaId(""); return; }
    setPickupLoading(true); setPickupAreaId("");
    apiGetAreas(pickupCountry)
      .then((data) => { setPickupAreas(data || []); setPickupLoading(false); });
  }, [pickupCountry]);

  // Load dropoff areas
  useEffect(() => {
    if (!dropoffCountry) { setDropoffAreas([]); setDropoffAreaId(""); return; }
    setDropoffLoading(true); setDropoffAreaId("");
    apiGetAreas(dropoffCountry)
      .then((data) => { setDropoffAreas(data || []); setDropoffLoading(false); });
  }, [dropoffCountry]);

  // Live price calculation
  useEffect(() => {
    const w = parseFloat(weight);
    if (!vehicleType || !weight || isNaN(w) || w <= 0 || !pickupCountry || !dropoffCountry) {
      setPriceBreakdown(null); return;
    }
    const calculate = async () => {
      setPriceLoading(true);
      try {
        if (isCrossBorder) {
          const pricing = await apiGetCrossBorderPricing(pickupCountry, dropoffCountry, vehicleType);
          if (!pricing) { setPriceBreakdown(null); return; }
          const weightFee = parseFloat(pricing.per_kg_rate) * w;
          setPriceBreakdown({
            baseFee: parseFloat(pricing.base_fee), weightFee: Math.round(weightFee),
            zoneMultiplier: 1, total: Math.round(parseFloat(pricing.base_fee) + weightFee),
            currency: pricing.currency, isCrossBorder: true,
          });
        } else {
          const pricing = await apiGetInlandPricing(pickupCountry, vehicleType);
          if (!pricing) { setPriceBreakdown(null); return; }
          const multiplierMap: Record<string, number> = {
            city:      parseFloat(pricing.zone_multiplier_city),
            suburb:    parseFloat(pricing.zone_multiplier_suburb),
            upcountry: parseFloat(pricing.zone_multiplier_upcountry),
          };
          const multiplier = multiplierMap[dropoffArea?.zone || "city"] || 1;
          const weightFee  = parseFloat(pricing.per_kg_rate) * w;
          setPriceBreakdown({
            baseFee: parseFloat(pricing.base_fee), weightFee: Math.round(weightFee),
            zoneMultiplier: multiplier,
            total: Math.round((parseFloat(pricing.base_fee) + weightFee) * multiplier),
            currency: pricing.currency, isCrossBorder: false,
          });
        }
      } finally { setPriceLoading(false); }
    };
    calculate();
  }, [vehicleType, weight, pickupCountry, dropoffCountry, dropoffArea, isCrossBorder]);

  const handleTrack = async () => {
    if (!trackingId.trim()) return;
    setIsTracking(true); setTrackingError(""); setTrackedShipment(null);
    try {
      const result = await apiTrackShipment(trackingId.trim());
      setTrackedShipment(result);
    } catch {
      setTrackingError("No shipment found with that tracking ID.");
    }
    setIsTracking(false);
  };

  const handleBookNow = () => {
    const params = new URLSearchParams({
      pickupCountry:  pickupCountry,
      dropoffCountry: dropoffCountry,
      pickupAreaId:   pickupAreaId,
      dropoffAreaId:  dropoffAreaId,
      vehicleType:    vehicleType,
      weight:         weight,
    });
    navigate(`/book?${params.toString()}`);
  };

  const canBook = pickupCountry && dropoffCountry && vehicleType && weight && parseFloat(weight) > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-primary">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Package className="h-7 w-7 text-secondary" />
            <span className="font-heading text-xl font-bold text-primary-foreground tracking-tight">Nation Courier</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-primary-foreground/80 text-sm font-medium">
            <a href="#quote"    className="hover:text-secondary transition-colors">Get Quote</a>
            <a href="#track"    className="hover:text-secondary transition-colors">Track Parcel</a>
            <a href="#services" className="hover:text-secondary transition-colors">Services</a>
            <a href="#contact"  className="hover:text-secondary transition-colors">Contact</a>
          </div>
          <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold" asChild>
            <Link to="/book">Book Now</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 pt-16">
          <img src={heroCourier} alt="Nation Courier" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        </div>

        <div className="relative container mx-auto px-6 md:px-16 lg:px-24 py-24 md:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — Text */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-medium mb-6">
                <Truck className="h-4 w-4" /> Uganda's Trusted Courier
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-foreground leading-tight mb-6">
                Delivering Across<br />
                <span className="text-secondary">Kampala & Beyond</span>
              </h1>
              <p className="text-lg text-primary-foreground/70 max-w-lg mb-8">
                Fast, reliable courier services with real-time tracking. From documents to bulk shipments — we move it all.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold" asChild>
                  <Link to="/book">Book a Shipment</Link>
                </Button>
                <Button size="lg" variant="outline"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-heading"
                  onClick={() => document.getElementById("track")?.scrollIntoView({ behavior: "smooth" })}>
                  Track Parcel
                </Button>
              </div>
              <div className="flex gap-8 mt-10">
                {[{ value: "4,000+", label: "Deliveries" }, { value: "3", label: "Countries" }, { value: "54", label: "Riders" }].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-heading text-2xl font-bold text-secondary">{stat.value}</p>
                    <p className="text-xs text-primary-foreground/60 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — Quote Calculator */}
            <motion.div id="quote" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
              <div className="bg-card rounded-2xl p-6 shadow-elevated">
                <h3 className="font-heading font-semibold text-card-foreground text-lg mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-secondary" /> Get an Instant Quote
                </h3>
                <div className="space-y-3">
                  {/* Vehicle & Weight */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Vehicle Type</Label>
                      <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                        <SelectContent>
                          {vehicleOptions.map((v) => <SelectItem key={v.value} value={v.value}>{v.label} — {v.desc}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                      <Input type="number" min="0.1" step="0.1" placeholder="e.g. 5.0"
                        value={weight} onChange={(e) => setWeight(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>

                  {/* Pickup */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" /> Pickup Country
                      </Label>
                      <Select value={pickupCountry} onValueChange={(v) => setPickupCountry(v as Country)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Country" /></SelectTrigger>
                        <SelectContent>
                          {countryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.flag} {c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" /> Pickup Area
                      </Label>
                      <Select value={pickupAreaId} onValueChange={setPickupAreaId} disabled={!pickupCountry || pickupLoading}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder={!pickupCountry ? "Country first" : pickupLoading ? "Loading..." : "Select area"} />
                        </SelectTrigger>
                        <SelectContent>
                          {pickupAreas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dropoff */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" /> Drop-off Country
                      </Label>
                      <Select value={dropoffCountry} onValueChange={(v) => setDropoffCountry(v as Country)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Country" /></SelectTrigger>
                        <SelectContent>
                          {countryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.flag} {c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" /> Drop-off Area
                      </Label>
                      <Select value={dropoffAreaId} onValueChange={setDropoffAreaId} disabled={!dropoffCountry || dropoffLoading}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder={!dropoffCountry ? "Country first" : dropoffLoading ? "Loading..." : "Select area"} />
                        </SelectTrigger>
                        <SelectContent>
                          {dropoffAreas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Cross-border warning */}
                  <AnimatePresence>
                    {isCrossBorder && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-xs text-secondary bg-secondary/10 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Cross-border — {pickupCountry} → {dropoffCountry}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Live Price */}
                  <AnimatePresence>
                    {priceLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-xs text-muted-foreground flex items-center gap-2 py-1">
                        <Calculator className="h-3.5 w-3.5 animate-pulse" /> Calculating...
                      </motion.div>
                    )}
                    {!priceLoading && priceBreakdown && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-secondary/10 border border-secondary/20 rounded-lg p-3 space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Base fee ({vehicleType})</span>
                          <span>{priceBreakdown.baseFee.toLocaleString()} {priceBreakdown.currency}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Weight ({weight}kg)</span>
                          <span>{priceBreakdown.weightFee.toLocaleString()} {priceBreakdown.currency}</span>
                        </div>
                        {!isCrossBorder && priceBreakdown.zoneMultiplier !== 1 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Zone ({dropoffArea?.zone})</span>
                            <span>× {priceBreakdown.zoneMultiplier}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-foreground border-t border-secondary/20 pt-1.5">
                          <span>Total Estimate</span>
                          <span className="text-secondary text-base">{priceBreakdown.total.toLocaleString()} {priceBreakdown.currency}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold"
                    disabled={!canBook} onClick={handleBookNow}>
                    Book Now <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Track Parcel */}
      <section id="track" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">Track Your Parcel</h2>
            <p className="text-muted-foreground">Enter your tracking ID to see real-time delivery status.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.1 }} className="max-w-lg mx-auto">
            <div className="flex gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="e.g. NC-UG-2026-0001" value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTrack(); }}
                  className="pl-10 bg-card" />
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold"
                disabled={isTracking} onClick={handleTrack}>
                {isTracking ? "Searching..." : "Track"}
              </Button>
            </div>

            {trackingError && <p className="text-destructive text-sm text-center mb-4">{trackingError}</p>}

            {trackedShipment ? (
              <div className="bg-card rounded-xl p-6 shadow-card">
                <div className="space-y-2 mb-6">
                  {[
                    { label: "Tracking ID", value: trackedShipment.tracking_id },
                    { label: "From",        value: trackedShipment.origin },
                    { label: "To",          value: trackedShipment.destination },
                    { label: "Rider",       value: trackedShipment.rider ?? "Not yet assigned" },
                    { label: "Status",      value: trackedShipment.status },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-2">
                  {statusSteps.map((step, i) => (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        i <= statusSteps.indexOf(trackedShipment.status) ? "bg-secondary border-secondary" : "bg-muted border-border"
                      }`} />
                      <span className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-center leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
                <div className="relative h-1 bg-muted rounded-full mt-1 mx-2">
                  <div className="absolute left-0 top-0 h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${(statusSteps.indexOf(trackedShipment.status) / (statusSteps.length - 1)) * 100}%` }} />
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  {statusSteps.map((step, i) => (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-4 h-4 rounded-full border-2 ${i <= 2 ? "bg-secondary border-secondary" : "bg-muted border-border"}`} />
                      <span className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-center leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
                <div className="relative h-1 bg-muted rounded-full mt-1 mx-2">
                  <div className="absolute left-0 top-0 h-full w-[50%] bg-secondary rounded-full" />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">Why Nation Courier?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Built for Uganda's logistics needs — speed, security, and visibility.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {services.map((svc, i) => (
              <motion.div key={svc.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow group">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                  <svc.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-heading font-semibold text-card-foreground text-lg mb-2">{svc.title}</h3>
                <p className="text-muted-foreground text-sm">{svc.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-6 w-6 text-secondary" />
                <span className="font-heading text-xl font-bold">Nation Courier</span>
              </div>
              <p className="text-primary-foreground/60 text-sm">Fast & reliable courier services across Uganda. Moving your parcels with care since day one.</p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/60">
                <li><a href="#quote"    className="hover:text-secondary transition-colors">Get a Quote</a></li>
                <li><a href="#track"    className="hover:text-secondary transition-colors">Track Parcel</a></li>
                <li><a href="#services" className="hover:text-secondary transition-colors">Our Services</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Contact Us</h4>
              <div className="space-y-3 text-sm text-primary-foreground/60">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-secondary" /><span>+256 700 000 000</span></div>
                <div className="flex items-center gap-2"><Mail  className="h-4 w-4 text-secondary" /><span>hello@nationcourier.ug</span></div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-secondary" /><span>Kampala, Uganda</span></div>
              </div>
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-xs text-primary-foreground/40">
            © 2026 Nation Courier. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;