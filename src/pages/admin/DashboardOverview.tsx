import { useEffect, useState } from "react";
import { Package, Users, TrendingUp, MapPin, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { countryStats, revenueByCountry } from "@/lib/mock-data";
import { fetchShipments, fetchRiders } from "@/lib/mock-data";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import type { Shipment, Rider } from "@/lib/mock-data";

const chartConfig = {
  Kenya: { label: "Kenya", color: "hsl(145, 60%, 40%)" },
  Uganda: { label: "Uganda", color: "hsl(32, 95%, 55%)" },
  Tanzania: { label: "Tanzania", color: "hsl(220, 60%, 50%)" },
};

export default function DashboardOverview() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, r] = await Promise.all([fetchShipments(), fetchRiders()]);
        setShipments(s);
        setRiders(r);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalRevenue = shipments.reduce((sum, s) => sum + (s.price || 0), 0);
  const availableRiders = riders.filter((r) => r.is_available).length;

  const statCards = [
    { title: "Total Shipments", value: loading ? "..." : shipments.length.toLocaleString(), icon: Package, change: "All time", color: "text-secondary" },
    { title: "Active Riders", value: loading ? "..." : availableRiders.toString(), icon: Users, change: `of ${riders.length} total`, color: "text-success" },
    { title: "Total Revenue", value: loading ? "..." : totalRevenue.toLocaleString(), icon: TrendingUp, change: "All time", color: "text-secondary" },
    { title: "Countries", value: "3", icon: MapPin, change: "EA Region", color: "text-primary" },
  ];

  const recentShipments = shipments.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time logistics across Kenya, Uganda & Tanzania</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground font-medium">{stat.change}</span>
                </div>
                <p className="mt-3 font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Country Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(["Kenya", "Uganda", "Tanzania"] as const).map((country) => {
          const flag = country === "Kenya" ? "🇰🇪" : country === "Uganda" ? "🇺🇬" : "🇹🇿";
          const currency = country === "Kenya" ? "KES" : country === "Uganda" ? "UGX" : "TZS";
          const countryShipments = shipments.filter((s) => s.country === country);
          const countryRiders = riders.filter((r) => r.country === country);
          const countryRevenue = countryShipments.reduce((sum, s) => sum + (s.price || 0), 0);
          return (
            <Card key={country} className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">{flag}</span> {country}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipments</span>
                  <span className="font-medium text-foreground">{countryShipments.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Riders</span>
                  <span className="font-medium text-foreground">{countryRiders.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-medium text-foreground">{currency} {countryRevenue.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Revenue by Country</CardTitle>
          <CardDescription>Last 6 months performance across East Africa</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={revenueByCountry}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="Kenya" fill="var(--color-Kenya)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Uganda" fill="var(--color-Uganda)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Tanzania" fill="var(--color-Tanzania)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Recent Shipments */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Recent Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : (
            <div className="space-y-3">
              {recentShipments.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-mono font-bold text-muted-foreground">
                      {s.country === "Kenya" ? "🇰🇪" : s.country === "Uganda" ? "🇺🇬" : "🇹🇿"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.tracking_id}</p>
                      <p className="text-xs text-muted-foreground">{s.origin} → {s.destination}</p>
                    </div>
                  </div>
                  <Badge variant={s.status === "Delivered" ? "default" : "secondary"} className="text-[10px]">
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}