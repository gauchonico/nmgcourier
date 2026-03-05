import { Package, Users, TrendingUp, MapPin, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { countryStats, revenueByCountry, shipments, riders } from "@/lib/mock-data";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const chartConfig = {
  Kenya: { label: "Kenya", color: "hsl(145, 60%, 40%)" },
  Uganda: { label: "Uganda", color: "hsl(32, 95%, 55%)" },
  Tanzania: { label: "Tanzania", color: "hsl(220, 60%, 50%)" },
};

const statCards = [
  { title: "Total Shipments", value: "4,292", icon: Package, change: "+14.2%", color: "text-secondary" },
  { title: "Active Riders", value: "54", icon: Users, change: "+6", color: "text-success" },
  { title: "Revenue (Mar)", value: "$878K", icon: TrendingUp, change: "+11.3%", color: "text-secondary" },
  { title: "Countries", value: "3", icon: MapPin, change: "EA Region", color: "text-primary" },
];

export default function DashboardOverview() {
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
                  <span className="text-xs text-success font-medium flex items-center gap-0.5">
                    {stat.change} <ArrowUpRight className="h-3 w-3" />
                  </span>
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
        {countryStats.map((cs) => (
          <Card key={cs.country} className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">{cs.flag}</span> {cs.country}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">+{cs.growth}%</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipments</span>
                <span className="font-medium text-foreground">{cs.totalShipments.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Riders</span>
                <span className="font-medium text-foreground">{cs.activeRiders}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-medium text-foreground">{cs.currency} {cs.revenue.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
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
          <div className="space-y-3">
            {recentShipments.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-mono font-bold text-muted-foreground">
                    {s.country === "Kenya" ? "🇰🇪" : s.country === "Uganda" ? "🇺🇬" : "🇹🇿"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.trackingId}</p>
                    <p className="text-xs text-muted-foreground">{s.origin} → {s.destination}</p>
                  </div>
                </div>
                <Badge
                  variant={s.status === "Delivered" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
