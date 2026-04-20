import { useEffect, useState } from "react";
import { Users, Filter, Star, Phone, Bike, Truck, Plus, X, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiGetRiders, apiCreateRider } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

type Country     = "Kenya" | "Uganda" | "Tanzania";
type VehicleType = "Bike" | "Van" | "Truck";

const countryFlag: Record<Country, string> = {
  Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿",
};

const vehicleIcon: Record<string, typeof Bike> = {
  Bike: Bike, Van: Truck, Truck: Truck,
};

const countryOptions = [
  { value: "Kenya",    label: "Kenya",    flag: "🇰🇪" },
  { value: "Uganda",   label: "Uganda",   flag: "🇺🇬" },
  { value: "Tanzania", label: "Tanzania", flag: "🇹🇿" },
];

const vehicleOptions = [
  { value: "Bike",  label: "Bike"  },
  { value: "Van",   label: "Van"   },
  { value: "Truck", label: "Truck" },
];

export default function RiderManagement() {
  const { toast }  = useToast();
  const navigate   = useNavigate();
  const [riders,        setRiders]        = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [showPanel,     setShowPanel]     = useState(false);
  const [saving,        setSaving]        = useState(false);

  // Form state
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [vehicle, setVehicle] = useState<VehicleType | "">("");
  const [country, setCountry] = useState<Country | "">("");
  const [city,    setCity]    = useState("");

  const load = async () => {
    setLoading(true);
    apiGetRiders().then(setRiders).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered      = countryFilter === "all" ? riders : riders.filter((r) => r.country === countryFilter);
  const available = filtered.filter((r) => getRiderStatus(r) === "Available").length;
  const totalEarnings = filtered.reduce((sum, r) => sum + (parseFloat(r.earnings) || 0), 0);
  const isValid       = name.trim() && phone.trim() && vehicle && country && city.trim();

  const resetForm  = () => { setName(""); setPhone(""); setVehicle(""); setCountry(""); setCity(""); };
  const closePanel = () => { setShowPanel(false); resetForm(); };

  const handleAddRider = async () => {
    if (!isValid || !vehicle || !country) return;
    setSaving(true);
    try {
      await apiCreateRider({
        name, phone,
        vehicle:          vehicle as VehicleType,
        country:          country as Country,
        city,
        is_available:     true,
        total_deliveries: 0,
        rating:           5.0,
        earnings:         0,
      });
      toast({ title: "Rider added!", description: `${name} has been added to the fleet.` });
      closePanel();
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Status: use the on_job flag appended by the API
  function getRiderStatus(rider: any): "On Job" | "Available" {
    if (typeof rider.on_job === "boolean") {
      return rider.on_job ? "On Job" : "Available";
    }
    // fallback if field is missing
    return rider.is_available ? "Available" : "On Job";
  }

  // Deliveries: already maintained by ShipmentController@updateRiderEarnings
  function getDeliveryCount(rider: any): number {
    return rider.total_deliveries ?? 0;
  }

  // Earnings: already maintained by ShipmentController@updateRiderEarnings
  function getEarnings(rider: any): number {
    return parseFloat(rider.earnings) || 0;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Rider Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and manage your delivery fleet</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2" onClick={() => setShowPanel(true)}>
            <Plus className="h-4 w-4" /> Add Rider
          </Button>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Countries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
              <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
              <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Riders",   value: filtered.length,                  color: "text-foreground"  },
          { label: "Available Now",  value: available,                         color: "text-success"     },
          { label: "Total Earnings", value: totalEarnings.toLocaleString(),    color: "text-secondary"   },
        ].map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`font-heading text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rider Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading riders...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rider</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Deliveries</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((rider, i) => {
                  const VIcon = vehicleIcon[rider.vehicle] || Bike;
                  return (
                    <motion.tr
                      key={rider.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => navigate(`/admin/riders/${rider.id}`)}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    >
                      <TableCell>
                        <p className="font-medium text-sm text-foreground">{rider.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {rider.phone}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm">
                          {countryFlag[rider.country as Country]} {rider.city}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <VIcon className="h-3.5 w-3.5" /> {rider.vehicle}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                      <Badge variant={getRiderStatus(rider) === "Available" ? "default" : "outline"} className="text-[10px]">
                        {getRiderStatus(rider)}
                      </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">{rider.total_deliveries ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-1 text-sm">
                          <Star className="h-3 w-3 text-secondary fill-secondary" /> {rider.rating}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-foreground">
                        {getEarnings(rider).toLocaleString()}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Rider Panel */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40" onClick={closePanel} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl z-50 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg font-bold text-foreground">Add New Rider</h2>
                      <p className="text-xs text-muted-foreground">Fill in the rider's details</p>
                    </div>
                  </div>
                  <button onClick={closePanel} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input placeholder="e.g. David Mukasa" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="e.g. +256 701 234 567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {countryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.flag} {c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Vehicle Type</Label>
                      <Select value={vehicle} onValueChange={(v) => setVehicle(v as VehicleType)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {vehicleOptions.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="e.g. Kampala" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                    <p>✅ New riders start as <strong>Available</strong></p>
                    <p>⭐ Default rating: <strong>5.0</strong></p>
                    <p>📦 Deliveries and earnings start at <strong>0</strong></p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={closePanel}>Cancel</Button>
                  <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold"
                    onClick={handleAddRider} disabled={!isValid || saving}>
                    {saving ? "Adding..." : "Add Rider"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}