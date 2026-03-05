import { useState } from "react";
import { Package, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shipments, type ShipmentStatus, type Country } from "@/lib/mock-data";
import { motion } from "framer-motion";

const statusColumns: ShipmentStatus[] = ["Pending", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];

const statusColors: Record<ShipmentStatus, string> = {
  "Pending": "bg-muted text-muted-foreground",
  "Picked Up": "bg-primary/10 text-primary",
  "In Transit": "bg-secondary/20 text-secondary-foreground",
  "Out for Delivery": "bg-secondary text-secondary-foreground",
  "Delivered": "bg-success text-success-foreground",
};

const countryFlag: Record<Country, string> = {
  Kenya: "🇰🇪",
  Uganda: "🇺🇬",
  Tanzania: "🇹🇿",
};

export default function ShipmentBoard() {
  const [countryFilter, setCountryFilter] = useState<string>("all");

  const filtered = countryFilter === "all"
    ? shipments
    : shipments.filter((s) => s.country === countryFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Shipment Board</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage shipment pipeline across regions</p>
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
                  >
                    <Card className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-foreground">{s.trackingId.split("-").slice(-1)}</span>
                          <span className="text-sm">{countryFlag[s.country]}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>{s.origin}</p>
                          <p className="text-foreground font-medium">→ {s.destination}</p>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{s.weight}kg</span>
                          {s.rider && (
                            <span className="text-primary font-medium truncate max-w-[80px]">{s.rider}</span>
                          )}
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
    </div>
  );
}
