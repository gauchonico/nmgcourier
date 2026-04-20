import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, X, Pencil, Trash2, RefreshCw, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiGetAreas, apiCreateArea, apiUpdateArea, apiDeleteArea } from "@/lib/api";

type Country = "Kenya" | "Uganda" | "Tanzania";
type Zone    = "city" | "suburb" | "upcountry";

interface Area {
  id: string; name: string; city: string; country: Country; zone: Zone;
}

const countryFlag: Record<Country, string> = {
  Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿",
};

const zoneColors: Record<Zone, string> = {
  city:       "bg-success/10 text-success",
  suburb:     "bg-secondary/10 text-secondary-foreground",
  upcountry:  "bg-primary/10 text-primary",
};

const emptyForm = { name: "", city: "", country: "Uganda" as Country, zone: "city" as Zone };

export default function AreasManager() {
  const { toast } = useToast();
  const [areas,         setAreas]         = useState<Area[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [showPanel,     setShowPanel]     = useState(false);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [form,          setForm]          = useState({ ...emptyForm });
  const [saving,        setSaving]        = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await apiGetAreas();
    setAreas(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = countryFilter === "all"
    ? areas
    : areas.filter((a) => a.country === countryFilter);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowPanel(true);
  };

  const openEdit = (area: Area) => {
    setEditingId(area.id);
    setForm({ name: area.name, city: area.city, country: area.country, zone: area.zone });
    setShowPanel(true);
  };

  const closePanel = () => {
    setShowPanel(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await apiUpdateArea(editingId, form);
        toast({ title: "Area updated!", description: `${form.name} has been updated.` });
      } else {
        await apiCreateArea(form);
        toast({ title: "Area added!", description: `${form.name} added to ${form.country}.` });
      }
      closePanel();
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await apiDeleteArea(id);
      toast({ title: "Area deleted", description: `${name} has been removed.` });
      setDeleteConfirm(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Areas Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage delivery areas and zones across all countries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Area
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

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(["city", "suburb", "upcountry"] as Zone[]).map((zone) => (
          <Card key={zone} className="shadow-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground capitalize">{zone} areas</p>
              <p className="font-heading text-2xl font-bold text-foreground mt-1">
                {filtered.filter((a) => a.zone === zone).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Areas Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-secondary" /> Delivery Areas
          </CardTitle>
          <CardDescription>{filtered.length} areas {countryFilter !== "all" ? `in ${countryFilter}` : "across all countries"}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-10">Loading areas...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((area, i) => (
                  <motion.tr key={area.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-sm">{area.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{area.city}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        {countryFlag[area.country]} {area.country}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] capitalize ${zoneColors[area.zone]}`}>{area.zone}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(area)} className="h-7 w-7 p-0">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        {deleteConfirm === area.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-destructive">Sure?</span>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(area.id, area.name)} className="h-7 px-2 text-xs text-destructive">Yes</Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)} className="h-7 px-2 text-xs">No</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(area.id)} className="h-7 w-7 p-0">
                            <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">No areas found.</TableCell>
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
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl z-50 overflow-y-auto">
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground">
                      {editingId ? "Edit Area" : "Add New Area"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {editingId ? "Update area details" : "Add a new delivery area"}
                    </p>
                  </div>
                  <button onClick={closePanel} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Area Name</Label>
                    <Input placeholder="e.g. Nakasero" value={form.name}
                      onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="e.g. Kampala" value={form.city}
                      onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select value={form.country} onValueChange={(v) => setForm(p => ({ ...p, country: v as Country }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
                          <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                          <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Zone</Label>
                      <Select value={form.zone} onValueChange={(v) => setForm(p => ({ ...p, zone: v as Zone }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="city">City</SelectItem>
                          <SelectItem value="suburb">Suburb</SelectItem>
                          <SelectItem value="upcountry">Upcountry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Zone info */}
                  <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                    <p>🏙️ <strong>City</strong> — multiplier × 1.0 (base price)</p>
                    <p>🏘️ <strong>Suburb</strong> — multiplier × 1.3 (+30%)</p>
                    <p>🌄 <strong>Upcountry</strong> — multiplier × 1.8 (+80%)</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={closePanel}>Cancel</Button>
                  <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold"
                    onClick={handleSave} disabled={saving || !form.name.trim() || !form.city.trim()}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Add Area"}
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