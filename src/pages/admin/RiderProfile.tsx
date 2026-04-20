import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Phone, MapPin, Star, Package, Truck, TrendingUp, Clock, CheckCircle2, Bike } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGetRider, apiGetEarningsConfig } from "@/lib/api";

type Country      = "Kenya" | "Uganda" | "Tanzania";
type ShipmentStatus = "Pending" | "Picked Up" | "In Transit" | "Out for Delivery" | "Delivered";

const countryFlag: Record<Country, string> = {
  Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿",
};

const statusColors: Record<ShipmentStatus, string> = {
  "Pending":          "bg-muted text-muted-foreground",
  "Picked Up":        "bg-primary/10 text-primary",
  "In Transit":       "bg-secondary/20 text-secondary-foreground",
  "Out for Delivery": "bg-secondary text-secondary-foreground",
  "Delivered":        "bg-success/20 text-success",
};

export default function RiderProfile() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [rider,     setRider]     = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [config,    setConfig]    = useState<any>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const data = await apiGetRider(id);
      if (!data) { setLoading(false); return; }
      const cfg = await apiGetEarningsConfig();
      setRider(data.rider);
      setShipments(data.shipments || []);
      setConfig(cfg);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm text-muted-foreground animate-pulse">Loading rider profile...</p>
    </div>
  );

  if (!rider) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-sm text-muted-foreground">Rider not found.</p>
      <Button variant="outline" onClick={() => navigate("/admin/riders")}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Riders
      </Button>
    </div>
  );

  const delivered       = shipments.filter((s) => s.status === "Delivered");
  const inProgress      = shipments.filter((s) => s.status !== "Delivered");
  const totalRevenue    = delivered.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
  const earningsPct     = parseFloat(config?.percentage) || 20;
  const calcEarnings    = Math.round(totalRevenue * (earningsPct / 100));

  const thisMonth          = new Date().toISOString().slice(0, 7);
  const thisMonthShipments = delivered.filter((s) => s.created_at?.slice(0, 7) === thisMonth);
  const thisMonthEarnings  = Math.round(
    thisMonthShipments.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0) * (earningsPct / 100)
  );

  const VIcon = rider.vehicle === "Bike" ? Bike : Truck;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/riders")} className="gap-1 text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to Riders
      </Button>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <span className="font-heading text-2xl font-bold text-secondary">
                  {rider.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-heading text-2xl font-bold text-foreground">{rider.name}</h1>
                  <Badge variant={rider.is_available ? "default" : "outline"} className="text-[10px]">
                    {rider.is_available ? "● Available" : "● On Job"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {rider.phone}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {countryFlag[rider.country as Country]} {rider.city}</span>
                  <span className="flex items-center gap-1.5"><VIcon className="h-3.5 w-3.5" /> {rider.vehicle}</span>
                  <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-secondary fill-secondary" /> {rider.rating}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Deliveries", value: delivered.length,                    icon: CheckCircle2, color: "text-success"   },
          { label: "In Progress",      value: inProgress.length,                   icon: Clock,        color: "text-primary"   },
          { label: "Total Earnings",   value: calcEarnings.toLocaleString(),        icon: TrendingUp,   color: "text-secondary" },
          { label: "This Month",       value: thisMonthEarnings.toLocaleString(),   icon: Package,      color: "text-secondary" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
                <p className="font-heading text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Earnings Breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-secondary" /> Earnings Breakdown
            </CardTitle>
            <CardDescription>Rider earns <strong>{earningsPct}%</strong> of each delivered shipment's price</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Total Shipment Revenue</p>
                <p className="font-heading text-lg font-bold text-foreground">{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">from {delivered.length} deliveries</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Rider's Cut ({earningsPct}%)</p>
                <p className="font-heading text-lg font-bold text-secondary">{calcEarnings.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">total earned</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="font-heading text-lg font-bold text-secondary">{thisMonthEarnings.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">from {thisMonthShipments.length} deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Shipment History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Shipment History
            </CardTitle>
            <CardDescription>{shipments.length} total shipments assigned</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {shipments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No shipments assigned yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {shipments.map((s, i) => {
                  const riderEarning = s.status === "Delivered"
                    ? Math.round((parseFloat(s.price) || 0) * (earningsPct / 100))
                    : null;
                  return (
                    <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs">
                          {s.country === "Kenya" ? "🇰🇪" : s.country === "Uganda" ? "🇺🇬" : "🇹🇿"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.tracking_id}</p>
                          <p className="text-xs text-muted-foreground">{s.origin} → {s.destination}</p>
                          <p className="text-xs text-muted-foreground">{s.created_at}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-sm font-medium text-foreground">{(parseFloat(s.price) || 0).toLocaleString()}</p>
                          {riderEarning !== null && (
                            <p className="text-xs text-secondary font-medium">+{riderEarning.toLocaleString()} earned</p>
                          )}
                        </div>
                        <Badge className={`text-[10px] ${statusColors[s.status as ShipmentStatus]}`}>
                          {s.status}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}