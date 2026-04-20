import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Plus, X, Pencil, Trash2, Fuel, RefreshCw, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiGetVehicles, apiCreateVehicle, apiUpdateVehicle, apiDeleteVehicle, apiGetRiders } from "@/lib/api";
import { motion as m } from "framer-motion";

type VehicleStatus = "available" | "on_trip" | "maintenance";
type Country = "Kenya" | "Uganda" | "Tanzania";
type VehicleType = "Bike" | "Van" | "Truck";

const countryFlag: Record<Country, string> = {
  Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿",
};

const statusColors: Record<VehicleStatus, string> = {
  available:   "bg-success/10 text-success",
  on_trip:     "bg-secondary/10 text-secondary-foreground",
  maintenance: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<VehicleStatus, string> = {
  available:   "Available",
  on_trip:     "On Trip",
  maintenance: "Maintenance",
};

const countryOptions = ["Kenya", "Uganda", "Tanzania"];
const vehicleTypes   = ["Bike", "Van", "Truck"];
const statusOptions  = ["available", "on_trip", "maintenance"];

const emptyForm = {
  plate: "", type: "Bike", country: "Uganda", city: "",
  fuel_litres: 0, fuel_capacity: 50, status: "available",
  make: "", model: "", year: new Date().getFullYear(), rider_id: "",
};

export default function FleetManagement() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [riders, setRiders]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [countryFilter, setCountryFilter] = useState("all");
  const [showPanel, setShowPanel]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState({ ...emptyForm });
  const [saving, setSaving]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [v, r] = await Promise.all([apiGetVehicles(), apiGetRiders()]);
    setVehicles(v);
    setRiders(r);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = countryFilter === "all"
    ? vehicles
    : vehicles.filter((v) => v.country === countryFilter);

  // Summary stats
  const available   = vehicles.filter((v) => v.status === "available").length;
  const onTrip      = vehicles.filter((v) => v.status === "on_trip").length;
  const maintenance = vehicles.filter((v) => v.status === "maintenance").length;

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowPanel(true);
  };

  const openEdit = (vehicle: any) => {
    setEditingId(vehicle.id);
    setForm({
      plate:         vehicle.plate,
      type:          vehicle.type,
      country:       vehicle.country,
      city:          vehicle.city || "",
      fuel_litres:   vehicle.fuel_litres || 0,
      fuel_capacity: vehicle.fuel_capacity || 50,
      status:        vehicle.status,
      make:          vehicle.make || "",
      model:         vehicle.model || "",
      year:          vehicle.year || new Date().getFullYear(),
      rider_id:      vehicle.rider_id || "",
    });
    setShowPanel(true);
  };

  const closePanel = () => {
    setShowPanel(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleSave = async () => {
    if (!form.plate.trim() || !form.city.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        rider_id: form.rider_id || null,
        fuel_litres: Number(form.fuel_litres),
        fuel_capacity: Number(form.fuel_capacity),
        year: Number(form.year),
      };
      if (editingId) {
        await apiUpdateVehicle(editingId, payload);
        toast({ title: "Vehicle updated!", description: `${form.plate} has been updated.` });
      } else {
        await apiCreateVehicle(payload);
        toast({ title: "Vehicle added!", description: `${form.plate} added to fleet.` });
      }
      closePanel();
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteVehicle(id);
      toast({ title: "Vehicle removed", description: "Vehicle deleted from fleet." });
      setDeleteConfirm(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const fuelPercent = (litres: number, capacity: number) =>
    Math.min(100, Math.round((litres / capacity) * 100));

  const fuelColor = (pct: number) =>
    pct > 50 ? "bg-success" : pct > 20 ? "bg-secondary" : "bg-destructive";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage vehicles, fuel levels and rider assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[150px]">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Vehicles", value: vehicles.length,  color: "text-foreground"  },
          { label: "Available",      value: available,         color: "text-success"      },
          { label: "On Trip",        value: onTrip,            color: "text-secondary"    },
          { label: "Maintenance",    value: maintenance,       color: "text-destructive"  },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`font-heading text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Vehicle Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-10">Loading fleet...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Assigned Rider</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v, i) => {
                  const pct = fuelPercent(v.fuel_litres, v.fuel_capacity);
                  const assignedRider = riders.find((r) => r.id === v.rider_id);
                  return (
                    <motion.tr
                      key={v.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <p className="font-mono font-bold text-sm text-foreground">{v.plate}</p>
                        <p className="text-xs text-muted-foreground">{v.make} {v.model} {v.year}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{countryFlag[v.country as Country]} {v.city}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{v.type}</Badge>
                      </TableCell>
                      <TableCell>
                      <Badge className={`text-[10px] ${statusColors[v.status as VehicleStatus] ?? "bg-muted text-muted-foreground"}`}>
                        {statusLabels[v.status as VehicleStatus] ?? v.status}
                      </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${fuelColor(pct)}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{v.fuel_litres}L</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignedRider
                          ? <span className="text-sm text-primary font-medium">{assignedRider.name}</span>
                          : <span className="text-xs text-muted-foreground">Unassigned</span>
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(v)} className="h-7 w-7 p-0">
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          {deleteConfirm === v.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-destructive">Sure?</span>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(v.id)} className="h-7 px-2 text-xs text-destructive hover:text-destructive">Yes</Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)} className="h-7 px-2 text-xs">No</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(v.id)} className="h-7 w-7 p-0">
                              <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Panel */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40" onClick={closePanel} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground">
                      {editingId ? "Edit Vehicle" : "Add Vehicle"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {editingId ? "Update vehicle details" : "Add a new vehicle to the fleet"}
                    </p>
                  </div>
                  <button onClick={closePanel} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Plate Number</Label>
                    <Input placeholder="e.g. UBE 123A" value={form.plate}
                      onChange={(e) => setForm(p => ({ ...p, plate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Make</Label>
                    <Input placeholder="e.g. Toyota" value={form.make}
                      onChange={(e) => setForm(p => ({ ...p, make: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input placeholder="e.g. Hiace" value={form.model}
                      onChange={(e) => setForm(p => ({ ...p, model: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input type="number" value={form.year}
                      onChange={(e) => setForm(p => ({ ...p, year: parseInt(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={form.country} onValueChange={(v) => setForm(p => ({ ...p, country: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {countryOptions.map((c) => (
                          <SelectItem key={c} value={c}>{countryFlag[c as Country]} {c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="e.g. Kampala" value={form.city}
                      onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>{statusLabels[s as VehicleStatus]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fuel (Litres)</Label>
                    <Input type="number" step="0.5" value={form.fuel_litres}
                      onChange={(e) => setForm(p => ({ ...p, fuel_litres: parseFloat(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fuel Capacity (L)</Label>
                    <Input type="number" value={form.fuel_capacity}
                      onChange={(e) => setForm(p => ({ ...p, fuel_capacity: parseFloat(e.target.value) }))} />
                  </div>

                  {/* Fuel preview */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="flex items-center gap-1"><Fuel className="h-3 w-3" /> Fuel Level</span>
                      <span>{fuelPercent(form.fuel_litres, form.fuel_capacity)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${fuelColor(fuelPercent(form.fuel_litres, form.fuel_capacity))}`}
                        style={{ width: `${fuelPercent(form.fuel_litres, form.fuel_capacity)}%` }}
                      />
                    </div>
                  </div>

                  {/* Assign rider */}
                  <div className="space-y-2 col-span-2">
                    <Label>Assign Rider (optional)</Label>
                    <Select value={form.rider_id} onValueChange={(v) => setForm(p => ({ ...p, rider_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select a rider" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Unassigned —</SelectItem>
                        {riders
                          .filter((r) =>
                            r.country === form.country &&        // same country as vehicle
                            (!r.on_job || r.id === form.rider_id) // available, or already assigned to this vehicle
                          )
                          .map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name} · {r.vehicle} · {r.city}
                              {r.on_job ? " ● On Job" : " ● Available"}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Only available riders from {form.country} — vehicles are shared, assignment is per trip
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={closePanel}>Cancel</Button>
                  <Button
                    className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold"
                    onClick={handleSave}
                    disabled={saving || !form.plate.trim() || !form.city.trim()}
                  >
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Add Vehicle"}
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