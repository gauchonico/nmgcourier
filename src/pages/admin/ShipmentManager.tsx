import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Pencil, Trash2, RefreshCw, Filter, Package, Save, Plus,
  Weight, User, Phone, MapPin, AlertTriangle, Calculator, CheckCircle2, Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  apiGetShipments, apiUpdateShipment, apiDeleteShipment, apiGetRiders,
  apiGetAreas, apiCreateShipment, apiGetInlandPricing, apiGetCrossBorderPricing,
} from "@/lib/api";
import type { Country, VehicleType, ShipmentStatus } from "@/lib/mock-data";

// ─── Types ───────────────────────────────────────────────────────────────────

type ShipmentStatusLocal = "Pending" | "Picked Up" | "In Transit" | "Out for Delivery" | "Delivered";
type CountryLocal        = "Kenya" | "Uganda" | "Tanzania";

interface Area {
  id: string;
  name: string;
  city: string;
  country: CountryLocal;
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

// ─── Constants ───────────────────────────────────────────────────────────────

const statusColors: Record<ShipmentStatusLocal, string> = {
  "Pending":          "bg-muted text-muted-foreground",
  "Picked Up":        "bg-primary/10 text-primary",
  "In Transit":       "bg-secondary/20 text-secondary-foreground",
  "Out for Delivery": "bg-secondary text-secondary-foreground",
  "Delivered":        "bg-success/20 text-success",
};

const countryFlag: Record<CountryLocal, string> = {
  Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿",
};

const statusOptions: ShipmentStatusLocal[] = [
  "Pending", "Picked Up", "In Transit", "Out for Delivery", "Delivered",
];

const countryOptions: { value: CountryLocal; label: string; flag: string }[] = [
  { value: "Kenya",    label: "Kenya",    flag: "🇰🇪" },
  { value: "Uganda",   label: "Uganda",   flag: "🇺🇬" },
  { value: "Tanzania", label: "Tanzania", flag: "🇹🇿" },
];

const vehicleOptions: { value: VehicleType; label: string; description: string }[] = [
  { value: "Bike",  label: "Bike",  description: "Up to 10kg — fast city delivery" },
  { value: "Van",   label: "Van",   description: "Up to 100kg — medium loads" },
  { value: "Truck", label: "Truck", description: "100kg+ — bulk & heavy cargo" },
];

function generateTrackingId(country: CountryLocal): string {
  const codes: Record<CountryLocal, string> = { Kenya: "KE", Uganda: "UG", Tanzania: "TZ" };
  const year = new Date().getFullYear();
  const seq  = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `NC-${codes[country]}-${year}-${seq}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ShipmentManager() {
  const { toast } = useToast();

  // Table state
  const [shipments,     setShipments]     = useState<any[]>([]);
  const [riders,        setRiders]        = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Edit panel state
  const [selected,   setSelected]   = useState<any>(null);
  const [saving,     setSaving]     = useState(false);
  const [editStatus, setEditStatus] = useState<ShipmentStatusLocal | "">("");
  const [editRider,  setEditRider]  = useState("");
  const [editPrice,  setEditPrice]  = useState("");
  const [editNotes,  setEditNotes]  = useState("");

  // New shipment panel state
  const [showNewPanel,   setShowNewPanel]   = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null); // tracking ID after success
  const [submitting,     setSubmitting]     = useState(false);

  // New shipment form fields (mirrored from BookShipment)
  const [pickupCountry,  setPickupCountry]  = useState<CountryLocal | "">("");
  const [dropoffCountry, setDropoffCountry] = useState<CountryLocal | "">("");
  const [pickupAreaId,   setPickupAreaId]   = useState("");
  const [dropoffAreaId,  setDropoffAreaId]  = useState("");
  const [pickupAreas,    setPickupAreas]    = useState<Area[]>([]);
  const [dropoffAreas,   setDropoffAreas]   = useState<Area[]>([]);
  const [pickupAreasLoading,  setPickupAreasLoading]  = useState(false);
  const [dropoffAreasLoading, setDropoffAreasLoading] = useState(false);
  const [senderName,   setSenderName]   = useState("");
  const [senderPhone,  setSenderPhone]  = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone,setReceiverPhone]= useState("");
  const [weight,       setWeight]       = useState("");
  const [vehicleType,  setVehicleType]  = useState<VehicleType | "">("");
  const [notes,        setNotes]        = useState("");
  const [priceBreakdown,  setPriceBreakdown]  = useState<PriceBreakdown | null>(null);
  const [priceLoading,    setPriceLoading]    = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const pickupArea    = pickupAreas.find((a) => a.id === pickupAreaId);
  const dropoffArea   = dropoffAreas.find((a) => a.id === dropoffAreaId);
  const isCrossBorder = pickupCountry !== dropoffCountry && !!pickupCountry && !!dropoffCountry;

  const isNewFormValid =
    !!pickupCountry && !!dropoffCountry &&
    senderName.trim() !== "" && senderPhone.trim() !== "" &&
    !!pickupAreaId && !!dropoffAreaId &&
    receiverName.trim() !== "" && receiverPhone.trim() !== "" &&
    !!weight && parseFloat(weight) > 0 && !!vehicleType &&
    priceBreakdown !== null;

  // ── Data loading ─────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const [s, r] = await Promise.all([apiGetShipments(), apiGetRiders()]);
    setShipments(s);
    setRiders(r);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Load pickup areas when country changes
  useEffect(() => {
    if (!pickupCountry) { setPickupAreas([]); return; }
    setPickupAreasLoading(true);
    setPickupAreaId("");
    apiGetAreas(pickupCountry)
      .then((data) => { setPickupAreas(data || []); setPickupAreasLoading(false); });
  }, [pickupCountry]);

  // Load dropoff areas when country changes
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
            pickupCountry as Country, dropoffCountry as Country, vehicleType as VehicleType,
          );
          if (!pricing) { setPriceBreakdown(null); return; }
          const weightFee = pricing.per_kg_rate * w;
          setPriceBreakdown({
            baseFee: pricing.base_fee, weightFee, zoneMultiplier: 1,
            total: pricing.base_fee + weightFee, currency: pricing.currency, isCrossBorder: true,
          });
        } else {
          const pricing = await apiGetInlandPricing(pickupCountry as Country, vehicleType as VehicleType);
          if (!pricing) { setPriceBreakdown(null); return; }
          const zone = dropoffArea?.zone || "city";
          const multiplierMap: Record<string, number> = {
            city: pricing.zone_multiplier_city,
            suburb: pricing.zone_multiplier_suburb,
            upcountry: pricing.zone_multiplier_upcountry,
          };
          const multiplier = multiplierMap[zone] || 1;
          const weightFee  = pricing.per_kg_rate * w;
          setPriceBreakdown({
            baseFee: pricing.base_fee, weightFee: Math.round(weightFee), zoneMultiplier: multiplier,
            total: Math.round((pricing.base_fee + weightFee) * multiplier),
            currency: pricing.currency, isCrossBorder: false,
          });
        }
      } finally {
        setPriceLoading(false);
      }
    };
    calculate();
  }, [vehicleType, weight, pickupCountry, dropoffCountry, dropoffArea, isCrossBorder]);

  // ── Edit panel handlers ───────────────────────────────────────────────────
  const openEdit = (shipment: any) => {
    setSelected(shipment);
    setEditStatus(shipment.status);
    setEditRider(shipment.rider || "");
    setEditPrice(shipment.price?.toString() || "");
    setEditNotes(shipment.notes || "");
  };

  const closeEdit = () => {
    setSelected(null);
    setEditStatus(""); setEditRider(""); setEditPrice(""); setEditNotes("");
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiUpdateShipment(selected.id, {
        status: editStatus,
        rider:  editRider === "unassigned" ? null : editRider,
        price:  parseFloat(editPrice),
        notes:  editNotes,
      });
      toast({ title: "Shipment updated!", description: `${selected.tracking_id} saved.` });
      closeEdit();
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, trackingId: string) => {
    try {
      await apiDeleteShipment(id);
      toast({ title: "Shipment deleted", description: `${trackingId} removed.` });
      setDeleteConfirm(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ── New shipment handlers ─────────────────────────────────────────────────
  const resetNewForm = () => {
    setPickupCountry(""); setDropoffCountry("");
    setPickupAreaId(""); setDropoffAreaId("");
    setSenderName(""); setSenderPhone("");
    setReceiverName(""); setReceiverPhone("");
    setWeight(""); setVehicleType(""); setNotes("");
    setPriceBreakdown(null); setBookingSuccess(null);
  };

  const closeNewPanel = () => { setShowNewPanel(false); resetNewForm(); };

  const handleBookShipment = async () => {
    if (!isNewFormValid || !pickupCountry || !dropoffCountry || !pickupArea || !dropoffArea || !priceBreakdown) return;
    setSubmitting(true);
    const trackingId = generateTrackingId(pickupCountry as CountryLocal);
    try {
      await apiCreateShipment({
        id: crypto.randomUUID(),
        tracking_id:    trackingId,
        sender:         senderName,
        receiver:       receiverName,
        origin:         pickupArea.name,
        destination:    dropoffArea.name,
        country:        pickupCountry as Country,
        pickup_country: pickupCountry,
        dropoff_country:dropoffCountry,
        is_cross_border:isCrossBorder,
        status:         "Pending" as ShipmentStatus,
        weight:         parseFloat(weight),
        price:          priceBreakdown.total,
        notes,
        created_at:     new Date().toISOString().split("T")[0],
      });
      setBookingSuccess(trackingId);
      toast({ title: "Shipment booked!", description: `Tracking ID: ${trackingId}` });
      load(); // refresh table in background
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered shipments ────────────────────────────────────────────────────
  const filtered = shipments.filter((s) => {
    const matchCountry = countryFilter === "all" || s.country === countryFilter;
    const matchSearch  = !search.trim() ||
      s.tracking_id?.toLowerCase().includes(search.toLowerCase()) ||
      s.sender?.toLowerCase().includes(search.toLowerCase()) ||
      s.receiver?.toLowerCase().includes(search.toLowerCase()) ||
      s.origin?.toLowerCase().includes(search.toLowerCase()) ||
      s.destination?.toLowerCase().includes(search.toLowerCase());
    return matchCountry && matchSearch;
  });

  // ── Eligible riders for edit panel (same country + available) ────────────
  const eligibleRiders = selected
    ? riders.filter((r) =>
        r.country === selected.country &&
        (!r.on_job || r.name === selected.rider)
      )
    : [];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Shipment Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Search, edit and delete shipments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
            onClick={() => setShowNewPanel(true)}>
            <Plus className="h-4 w-4" /> New Shipment
          </Button>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Countries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
              <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
              <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by tracking ID, sender, receiver, origin..."
          value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {search && (
        <p className="text-sm text-muted-foreground">
          Found <strong>{filtered.length}</strong> shipment{filtered.length !== 1 ? "s" : ""} matching "{search}"
        </p>
      )}

      {/* Shipments Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-10">Loading shipments...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Sender → Receiver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rider</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }} className="border-b hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{countryFlag[s.country as CountryLocal]}</span>
                        <span className="font-mono text-xs font-bold text-foreground">{s.tracking_id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.created_at}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{s.sender}</p>
                      <p className="text-xs text-muted-foreground">→ {s.receiver}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">{s.origin}</p>
                      <p className="text-xs text-foreground font-medium truncate max-w-[140px]">→ {s.destination}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${statusColors[s.status as ShipmentStatusLocal]}`}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{s.rider || "—"}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {parseFloat(s.price).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)} className="h-7 w-7 p-0">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        {deleteConfirm === s.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-destructive">Sure?</span>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id, s.tracking_id)}
                              className="h-7 px-2 text-xs text-destructive">Yes</Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}
                              className="h-7 px-2 text-xs">No</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(s.id)} className="h-7 w-7 p-0">
                            <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                      {search ? `No shipments found matching "${search}"` : "No shipments found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Panel ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40" onClick={closeEdit} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl z-50 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground">{selected.tracking_id}</h2>
                    <p className="text-xs text-muted-foreground">{selected.origin} → {selected.destination}</p>
                  </div>
                  <button onClick={closeEdit} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sender</span>
                    <span className="font-medium">{selected.sender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receiver</span>
                    <span className="font-medium">{selected.receiver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-medium">{selected.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booked</span>
                    <span className="font-medium">{selected.created_at}</span>
                  </div>
                  {selected.is_cross_border == 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="secondary" className="text-[10px]">🌍 Cross-border</Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ShipmentStatusLocal)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign Rider</Label>
                    <Select value={editRider} onValueChange={setEditRider}>
                      <SelectTrigger><SelectValue placeholder="Select rider" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">— Unassigned —</SelectItem>
                        {eligibleRiders.map((r) => (
                          <SelectItem key={r.id} value={r.name}>
                            {r.name} ({r.vehicle} · {r.city})
                            {r.on_job ? " ● On Job" : " ● Available"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input type="number" value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)} placeholder="e.g. 15000" />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)} placeholder="Any special instructions..." />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={closeEdit}>Cancel</Button>
                  <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold"
                    onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── New Shipment Panel ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40" onClick={closeNewPanel} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-background shadow-2xl z-50 overflow-y-auto">
              <div className="p-6 space-y-6">

                {/* Panel header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg font-bold text-foreground">New Shipment</h2>
                      <p className="text-xs text-muted-foreground">Fill in details to book a shipment</p>
                    </div>
                  </div>
                  <button onClick={closeNewPanel} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* ── Success state ── */}
                {bookingSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-7 w-7 text-success" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground">Shipment Booked!</h3>
                      <p className="text-sm text-muted-foreground mt-1">Share the tracking ID with the recipient.</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Tracking ID</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-heading text-xl font-bold text-foreground tracking-wide">{bookingSuccess}</span>
                        <button onClick={() => {
                          navigator.clipboard.writeText(bookingSuccess);
                          toast({ title: "Copied!", description: "Tracking ID copied." });
                        }} className="text-muted-foreground hover:text-foreground">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {priceBreakdown && (
                      <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-1">
                        <div className="flex justify-between text-muted-foreground text-xs">
                          <span>Base fee</span>
                          <span>{priceBreakdown.baseFee.toLocaleString()} {priceBreakdown.currency}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground text-xs">
                          <span>Weight fee</span>
                          <span>{priceBreakdown.weightFee.toLocaleString()} {priceBreakdown.currency}</span>
                        </div>
                        <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 mt-1">
                          <span>Total</span>
                          <span className="text-secondary">{priceBreakdown.total.toLocaleString()} {priceBreakdown.currency}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="flex-1" onClick={closeNewPanel}>Close</Button>
                      <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold"
                        onClick={resetNewForm}>
                        Book Another
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Form ── */
                  <div className="space-y-5">

                    {/* Vehicle & Weight */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Vehicle Type</Label>
                        <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                          <Input type="number" min="0.1" step="0.1" placeholder="e.g. 5.0"
                            value={weight} onChange={(e) => setWeight(e.target.value)} className="pl-10" />
                        </div>
                      </div>
                    </div>

                    {/* Pickup */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-success" /> Pickup
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={pickupCountry} onValueChange={(v) => setPickupCountry(v as CountryLocal)}>
                          <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.flag} {c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={pickupAreaId} onValueChange={setPickupAreaId}
                          disabled={!pickupCountry || pickupAreasLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder={!pickupCountry ? "Country first" : pickupAreasLoading ? "Loading..." : "Area"} />
                          </SelectTrigger>
                          <SelectContent>
                            {pickupAreas.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name} <span className="text-xs text-muted-foreground capitalize">({a.zone})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Dropoff */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-destructive" /> Drop-off
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={dropoffCountry} onValueChange={(v) => setDropoffCountry(v as CountryLocal)}>
                          <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.flag} {c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={dropoffAreaId} onValueChange={setDropoffAreaId}
                          disabled={!dropoffCountry || dropoffAreasLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder={!dropoffCountry ? "Country first" : dropoffAreasLoading ? "Loading..." : "Area"} />
                          </SelectTrigger>
                          <SelectContent>
                            {dropoffAreas.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name} <span className="text-xs text-muted-foreground capitalize">({a.zone})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Cross-border warning */}
                    <AnimatePresence>
                      {isCrossBorder && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-start gap-3 bg-secondary/10 border border-secondary/20 rounded-lg p-3">
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

                    {/* Live price */}
                    <AnimatePresence>
                      {priceLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                          <Calculator className="h-4 w-4 animate-pulse" /> Calculating price...
                        </motion.div>
                      )}
                      {!priceLoading && priceBreakdown && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 space-y-1.5">
                          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-secondary" /> Price Breakdown
                          </p>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Base fee ({vehicleType})</span>
                              <span>{priceBreakdown.baseFee.toLocaleString()} {priceBreakdown.currency}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Weight fee ({weight}kg)</span>
                              <span>{priceBreakdown.weightFee.toLocaleString()} {priceBreakdown.currency}</span>
                            </div>
                            {!isCrossBorder && priceBreakdown.zoneMultiplier !== 1 && (
                              <div className="flex justify-between text-muted-foreground">
                                <span>Zone ({dropoffArea?.zone})</span>
                                <span>× {priceBreakdown.zoneMultiplier}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-foreground border-t border-secondary/30 pt-1.5 mt-1">
                              <span>Total</span>
                              <span className="text-secondary text-sm">
                                {priceBreakdown.total.toLocaleString()} {priceBreakdown.currency}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Sender */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-success" /> Sender
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Full name" value={senderName}
                            onChange={(e) => setSenderName(e.target.value)} className="pl-10" />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Phone" value={senderPhone}
                            onChange={(e) => setSenderPhone(e.target.value)} className="pl-10" />
                        </div>
                      </div>
                    </div>

                    {/* Receiver */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-destructive" /> Receiver
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Full name" value={receiverName}
                            onChange={(e) => setReceiverName(e.target.value)} className="pl-10" />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Phone" value={receiverPhone}
                            onChange={(e) => setReceiverPhone(e.target.value)} className="pl-10" />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea placeholder="e.g. Fragile items, call before delivery..."
                        value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[70px]" />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="flex-1" onClick={closeNewPanel}>Cancel</Button>
                      <Button
                        className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold"
                        onClick={handleBookShipment} disabled={!isNewFormValid || submitting}>
                        <Package className="h-4 w-4 mr-2" />
                        {submitting ? "Booking..." : "Book Shipment"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}