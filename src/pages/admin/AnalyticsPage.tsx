import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { countryStats, revenueByCountry, shipments, riders } from "@/lib/mock-data";
import { motion } from "framer-motion";

const chartConfig = {
  Kenya: { label: "Kenya", color: "hsl(145, 60%, 40%)" },
  Uganda: { label: "Uganda", color: "hsl(32, 95%, 55%)" },
  Tanzania: { label: "Tanzania", color: "hsl(220, 60%, 50%)" },
};

const pieData = countryStats.map((cs) => ({
  name: cs.country,
  value: cs.totalShipments,
  fill: cs.country === "Kenya" ? "hsl(145, 60%, 40%)" : cs.country === "Uganda" ? "hsl(32, 95%, 55%)" : "hsl(220, 60%, 50%)",
}));

const riderPerformance = riders
  .sort((a, b) => b.totalDeliveries - a.totalDeliveries)
  .slice(0, 5)
  .map((r) => ({ name: r.name.split(" ")[0], deliveries: r.totalDeliveries, earnings: r.earnings, rating: r.rating }));

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Revenue Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Financial performance and operational insights</p>
      </div>

      {/* Revenue Trend */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue by country (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={revenueByCountry}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="Kenya" stroke="var(--color-Kenya)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Uganda" stroke="var(--color-Uganda)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Tanzania" stroke="var(--color-Tanzania)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Distribution */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Shipment Distribution</CardTitle>
            <CardDescription>By country</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Riders */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Top Riders</CardTitle>
            <CardDescription>By total deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ deliveries: { label: "Deliveries", color: "hsl(32, 95%, 55%)" } }} className="h-[250px] w-full">
              <BarChart data={riderPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={60} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="deliveries" fill="var(--color-deliveries)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Country Performance Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Country Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {countryStats.map((cs, i) => (
              <motion.div
                key={cs.country}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-lg border border-border bg-muted/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                    <span className="text-xl">{cs.flag}</span> {cs.country}
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">+{cs.growth}%</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Shipments</p>
                    <p className="font-bold text-foreground">{cs.totalShipments.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Riders</p>
                    <p className="font-bold text-foreground">{cs.activeRiders}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Revenue ({cs.currency})</p>
                    <p className="font-bold text-foreground text-lg">{cs.revenue.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
