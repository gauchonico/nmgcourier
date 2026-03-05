import { useState } from "react";
import { Users, Filter, Star, Phone, Bike, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { riders, type Country } from "@/lib/mock-data";
import { motion } from "framer-motion";

const countryFlag: Record<Country, string> = {
  Kenya: "🇰🇪",
  Uganda: "🇺🇬",
  Tanzania: "🇹🇿",
};

const vehicleIcon: Record<string, typeof Bike> = {
  Bike: Bike,
  Van: Truck,
  Truck: Truck,
};

export default function RiderManagement() {
  const [countryFilter, setCountryFilter] = useState<string>("all");

  const filtered = countryFilter === "all"
    ? riders
    : riders.filter((r) => r.country === countryFilter);

  const available = filtered.filter((r) => r.isAvailable).length;
  const totalEarnings = filtered.reduce((sum, r) => sum + r.earnings, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Rider Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and manage your delivery fleet</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Riders</p>
            <p className="font-heading text-2xl font-bold text-foreground mt-1">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Available Now</p>
            <p className="font-heading text-2xl font-bold text-success mt-1">{available}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Earnings</p>
            <p className="font-heading text-2xl font-bold text-secondary mt-1">{totalEarnings.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rider Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
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
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-foreground">{rider.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {rider.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        {countryFlag[rider.country]} {rider.city}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <VIcon className="h-3.5 w-3.5" /> {rider.vehicle}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={rider.isAvailable ? "default" : "outline"} className="text-[10px]">
                        {rider.isAvailable ? "Available" : "On Job"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">{rider.totalDeliveries}</TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1 text-sm">
                        <Star className="h-3 w-3 text-secondary fill-secondary" /> {rider.rating}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium text-foreground">
                      {rider.earnings.toLocaleString()}
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
