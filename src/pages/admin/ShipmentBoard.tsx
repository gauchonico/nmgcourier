import { useEffect, useState } from "react";
import { Filter, X, UserCheck, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchShipments, fetchRiders, updateShipmentStatus, assignRider } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { ShipmentStatus, Country } from "@/lib/mock-data";
import { fetchEarningsConfig, fetchShipmentsByRider, updateRiderEarnings } from "@/lib/mock-data";

const statusColumns: ShipmentStatus[] = ["Pending", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];

const statusColors: Record<ShipmentStatus, string> = {
  "Pending": "bg-muted text-muted-foreground",
  "Picked Up": "bg-primary/10 text-primary",
  "In Transit": "bg-secondary/20 text-secondary-foreground",
  "Out for Delivery": "bg-secondary text-secondary-foreground",
  "Delivered": "bg-success/20 text-success",
};

const countryFlag: Record<Country, string> = {
  Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿",
};

export default function ShipmentBoard() {
  const { toast } = useToast();
  const [shipments, setShipments] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  // Panel state
  const [newStatus, setNewStatus] = useState<ShipmentStatus | "">("");
  const [newRider, setNewRider] = useState("");

  const load = async () => {
    setLoading(true);
    const [s, r] = await Promise.all([fetchShipments(), fetchRiders()]);
    setShipments(s);
    setRiders(r);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openPanel = (shipment: any) => {
    setSelected(shipment);
    setNewStatus(shipment.status);
    setNewRider(shipment.rider || "");
  };

  const closePanel = () => {
    setSelected(null);
    setNewStatus("");
    setNewRider("");
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      if (newStatus && newStatus !== selected.status) {
        await updateShipmentStatus(selected.id, newStatus as ShipmentStatus);
  
        // Auto-update rider earnings when delivered
        if (newStatus === "Delivered" && selected.rider) {
          const [config, allRiders, riderShipments] = await Promise.all([
            fetchEarningsConfig(),
            fetchRiders(),
            fetchShipmentsByRider(selected.rider),
          ]);
  
          const rider = allRiders.find((r: any) => r.name === selected.rider);
          if (rider && config) {
            const percentage = config.percentage / 100;
            // Recalculate total earnings from all delivered shipments
            const deliveredShipments = riderShipments.filter(
              (s: any) => s.status === "Delivered" || s.id === selected.id
            );
            const totalEarnings = deliveredShipments.reduce(
              (sum: number, s: any) => sum + (s.price || 0) * percentage, 0
            );
            await updateRiderEarnings(
              rider.id,
              Math.round(totalEarnings),
              deliveredShipments.length
            );
          }
        }
      }
  
      if (newRider !== selected.rider) {
        const riderToAssign = newRider === "unassigned" ? "" : newRider;
        await assignRider(selected.id, riderToAssign);
      }
  
      toast({ title: "Shipment updated!", description: `${selected.tracking_id} has been updated.` });
      closePanel();
      await load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const filtered = countryFilter === "all"
    ? shipments
    : shipments.filter((s) => s.country === countryFilter);

  // Only show available riders matching the shipment's vehicle type
  const eligibleRiders = selected
    ? riders.filter((r) => r.is_available || r.name === selected.rider)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Shipment Board</h1>
          <p className="text-sm text-muted-foreground mt-1">Click any shipment to update status or assign a rider</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
              <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
              <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Loading shipments...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statusColumns.map((status) => {
            const columnShipments = filtered.filter((s) => s.status === status);
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-semibold text-foreground">{status}</h3>
                  <Badge variant="outline" className="text-[10px] h-5">{columnShipments.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {columnShipments.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => openPanel(s)}
                    >
                      <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer hover:border-secondary/50 border border-transparent">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {s.tracking_id?.split("-").slice(-1)}
                            </span>
                            <span className="text-sm">{countryFlag[s.country as Country]}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p className="truncate">{s.origin}</p>
                            <p className="text-foreground font-medium truncate">→ {s.destination}</p>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">{s.weight}kg</span>
                            {s.rider
                              ? <span className="text-primary font-medium truncate max-w-[80px]">{s.rider}</span>
                              : <span className="text-destructive/70">No rider</span>
                            }
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  {columnShipments.length === 0 && (
                    <div className="flex items-center justify-center h-24 border border-dashed border-border rounded-lg">
                      <p className="text-xs text-muted-foreground">No shipments</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side Panel */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={closePanel}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground">{selected.tracking_id}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{selected.origin} → {selected.destination}</p>
                  </div>
                  <button onClick={closePanel} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Shipment Info */}
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sender</span>
                    <span className="font-medium text-foreground">{selected.sender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receiver</span>
                    <span className="font-medium text-foreground">{selected.receiver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-medium text-foreground">{selected.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium text-secondary">{selected.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booked</span>
                    <span className="font-medium text-foreground">{selected.created_at}</span>
                  </div>
                  {selected.is_cross_border && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="secondary" className="text-[10px]">🌍 Cross-border</Badge>
                    </div>
                  )}
                </div>

                {/* Update Status */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Update Status</label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ShipmentStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusColumns.map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className={`inline-flex items-center gap-2`}>
                            {s}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assign Rider */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-secondary" /> Assign Rider
                  </label>
                  <Select value={newRider} onValueChange={setNewRider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a rider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">— Unassigned —</SelectItem>
                      {eligibleRiders.map((r) => (
                        <SelectItem key={r.id} value={r.name}>
                          <span className="flex items-center gap-2">
                            {r.name}
                            <span className="text-xs text-muted-foreground">({r.vehicle} · {r.city})</span>
                            {r.is_available
                              ? <span className="text-xs text-success">● Available</span>
                              : <span className="text-xs text-muted-foreground">● On job</span>
                            }
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Only showing available riders</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={closePanel}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold"
                    onClick={handleUpdate}
                    disabled={updating}
                  >
                    {updating ? "Saving..." : "Save Changes"}
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