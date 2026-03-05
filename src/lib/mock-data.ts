export type Country = "Kenya" | "Uganda" | "Tanzania";
export type ShipmentStatus = "Pending" | "Picked Up" | "In Transit" | "Out for Delivery" | "Delivered";
export type VehicleType = "Bike" | "Van" | "Truck";

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle: VehicleType;
  country: Country;
  city: string;
  isAvailable: boolean;
  totalDeliveries: number;
  rating: number;
  earnings: number;
}

export interface Shipment {
  id: string;
  trackingId: string;
  sender: string;
  receiver: string;
  origin: string;
  destination: string;
  country: Country;
  status: ShipmentStatus;
  rider?: string;
  weight: number;
  price: number;
  createdAt: string;
}

export const riders: Rider[] = [
  { id: "r1", name: "James Ochieng", phone: "+254712345678", vehicle: "Bike", country: "Kenya", city: "Nairobi", isAvailable: true, totalDeliveries: 342, rating: 4.8, earnings: 45200 },
  { id: "r2", name: "Grace Wanjiku", phone: "+254798765432", vehicle: "Van", country: "Kenya", city: "Mombasa", isAvailable: false, totalDeliveries: 198, rating: 4.6, earnings: 38700 },
  { id: "r3", name: "David Mukasa", phone: "+256701234567", vehicle: "Bike", country: "Uganda", city: "Kampala", isAvailable: true, totalDeliveries: 521, rating: 4.9, earnings: 62300 },
  { id: "r4", name: "Sarah Nalubega", phone: "+256789012345", vehicle: "Van", country: "Uganda", city: "Entebbe", isAvailable: true, totalDeliveries: 156, rating: 4.5, earnings: 28400 },
  { id: "r5", name: "Emmanuel Rwiza", phone: "+255712345678", vehicle: "Truck", country: "Tanzania", city: "Dar es Salaam", isAvailable: false, totalDeliveries: 287, rating: 4.7, earnings: 51800 },
  { id: "r6", name: "Amina Hassan", phone: "+255798765432", vehicle: "Bike", country: "Tanzania", city: "Arusha", isAvailable: true, totalDeliveries: 413, rating: 4.8, earnings: 47600 },
  { id: "r7", name: "Peter Kamau", phone: "+254711222333", vehicle: "Truck", country: "Kenya", city: "Nairobi", isAvailable: true, totalDeliveries: 89, rating: 4.3, earnings: 22100 },
  { id: "r8", name: "Julius Ssempa", phone: "+256700111222", vehicle: "Bike", country: "Uganda", city: "Jinja", isAvailable: false, totalDeliveries: 675, rating: 4.9, earnings: 78200 },
];

export const shipments: Shipment[] = [
  { id: "s1", trackingId: "NC-KE-2026-0001", sender: "John Mwangi", receiver: "Alice Nyambura", origin: "Nairobi CBD", destination: "Westlands", country: "Kenya", status: "Delivered", rider: "James Ochieng", weight: 2.5, price: 450, createdAt: "2026-03-01" },
  { id: "s2", trackingId: "NC-KE-2026-0002", sender: "Safaricom Ltd", receiver: "Tech Hub Kenya", origin: "Kilimani", destination: "Karen", country: "Kenya", status: "In Transit", rider: "Grace Wanjiku", weight: 8.0, price: 1200, createdAt: "2026-03-04" },
  { id: "s3", trackingId: "NC-UG-2026-0001", sender: "MTN Uganda", receiver: "Makerere University", origin: "Nakasero", destination: "Makerere", country: "Uganda", status: "Picked Up", rider: "David Mukasa", weight: 1.0, price: 15000, createdAt: "2026-03-04" },
  { id: "s4", trackingId: "NC-UG-2026-0002", sender: "Fresh Farms", receiver: "Garden City Mall", origin: "Entebbe", destination: "Kampala", country: "Uganda", status: "Out for Delivery", rider: "Sarah Nalubega", weight: 25.0, price: 45000, createdAt: "2026-03-03" },
  { id: "s5", trackingId: "NC-TZ-2026-0001", sender: "Vodacom TZ", receiver: "UDSM Campus", origin: "Posta", destination: "Mlimani", country: "Tanzania", status: "Pending", weight: 3.0, price: 8500, createdAt: "2026-03-05" },
  { id: "s6", trackingId: "NC-TZ-2026-0002", sender: "Kilimanjaro Coffee", receiver: "Serena Hotel", origin: "Arusha", destination: "Dar es Salaam", country: "Tanzania", status: "In Transit", rider: "Emmanuel Rwiza", weight: 50.0, price: 75000, createdAt: "2026-03-02" },
  { id: "s7", trackingId: "NC-KE-2026-0003", sender: "Jumia Kenya", receiver: "Mary Atieno", origin: "Industrial Area", destination: "Kisumu", country: "Kenya", status: "Pending", weight: 4.2, price: 890, createdAt: "2026-03-05" },
  { id: "s8", trackingId: "NC-UG-2026-0003", sender: "Airtel Uganda", receiver: "Kampala Mall", origin: "Kololo", destination: "Ntinda", country: "Uganda", status: "Delivered", rider: "Julius Ssempa", weight: 0.5, price: 8000, createdAt: "2026-02-28" },
  { id: "s9", trackingId: "NC-KE-2026-0004", sender: "Nation Media", receiver: "Standard Group", origin: "Kimathi St", destination: "Mombasa Rd", country: "Kenya", status: "Picked Up", rider: "Peter Kamau", weight: 12.0, price: 1500, createdAt: "2026-03-04" },
  { id: "s10", trackingId: "NC-TZ-2026-0003", sender: "CRDB Bank", receiver: "NMB HQ", origin: "Kariakoo", destination: "Masaki", country: "Tanzania", status: "Out for Delivery", rider: "Amina Hassan", weight: 2.0, price: 12000, createdAt: "2026-03-04" },
];

export const revenueByCountry = [
  { month: "Oct", Kenya: 125000, Uganda: 340000, Tanzania: 210000 },
  { month: "Nov", Kenya: 148000, Uganda: 385000, Tanzania: 245000 },
  { month: "Dec", Kenya: 189000, Uganda: 420000, Tanzania: 298000 },
  { month: "Jan", Kenya: 165000, Uganda: 395000, Tanzania: 276000 },
  { month: "Feb", Kenya: 201000, Uganda: 458000, Tanzania: 312000 },
  { month: "Mar", Kenya: 178000, Uganda: 410000, Tanzania: 290000 },
];

export const deliveriesByStatus: Record<ShipmentStatus, number> = {
  "Pending": 2,
  "Picked Up": 2,
  "In Transit": 2,
  "Out for Delivery": 2,
  "Delivered": 2,
};

export const countryStats = [
  { country: "Kenya" as Country, flag: "🇰🇪", currency: "KES", totalShipments: 1247, activeRiders: 18, revenue: 1006000, growth: 12.4 },
  { country: "Uganda" as Country, flag: "🇺🇬", currency: "UGX", totalShipments: 2089, activeRiders: 24, revenue: 2408000, growth: 18.7 },
  { country: "Tanzania" as Country, flag: "🇹🇿", currency: "TZS", totalShipments: 956, activeRiders: 12, revenue: 1631000, growth: 8.2 },
];
