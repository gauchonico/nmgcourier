import { useState } from "react";
import { motion } from "framer-motion";
import { Package, MapPin, User, Phone, Mail, Weight, ChevronLeft, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import type { Country, VehicleType } from "@/lib/mock-data";

const countryOptions: { value: Country; label: string; flag: string; code: string }[] = [
  { value: "Kenya", label: "Kenya", flag: "🇰🇪", code: "KE" },
  { value: "Uganda", label: "Uganda", flag: "🇺🇬", code: "UG" },
  { value: "Tanzania", label: "Tanzania", flag: "🇹🇿", code: "TZ" },
];

const vehicleOptions: { value: VehicleType; label: string; description: string }[] = [
  { value: "Bike", label: "Bike", description: "Up to 10kg — fast city delivery" },
  { value: "Van", label: "Van", description: "Up to 100kg — medium loads" },
  { value: "Truck", label: "Truck", description: "100kg+ — bulk & heavy cargo" },
];

function generateTrackingId(country: Country): string {
  const code = countryOptions.find((c) => c.value === country)?.code ?? "XX";
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `NC-${code}-${year}-${seq}`;
}

const BookShipment = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "confirmed">("form");
  const [trackingId, setTrackingId] = useState("");

  // Form state
  const [country, setCountry] = useState<Country | "">("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [weight, setWeight] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType | "">("");
  const [notes, setNotes] = useState("");

  const isValid =
    country &&
    senderName.trim() &&
    senderPhone.trim() &&
    pickupAddress.trim() &&
    receiverName.trim() &&
    receiverPhone.trim() &&
    dropoffAddress.trim() &&
    weight &&
    parseFloat(weight) > 0 &&
    vehicleType;

  const handleSubmit = () => {
    if (!isValid || !country) return;
    const id = generateTrackingId(country as Country);
    setTrackingId(id);
    setStep("confirmed");
    toast({ title: "Shipment booked!", description: `Tracking ID: ${id}` });
  };

  const copyTrackingId = () => {
    navigator.clipboard.writeText(trackingId);
    toast({ title: "Copied!", description: "Tracking ID copied to clipboard." });
  };

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full"
        >
          <Card className="shadow-elevated text-center">
            <CardContent className="pt-10 pb-8 px-8">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Shipment Booked!</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Your parcel has been registered. Share the tracking ID with your recipient.
              </p>

              <div className="bg-muted rounded-lg p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Tracking ID</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-heading text-xl font-bold text-foreground tracking-wide">{trackingId}</span>
                  <button onClick={copyTrackingId} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="text-left bg-muted/50 rounded-lg p-4 mb-6 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country</span>
                  <span className="font-medium text-foreground">
                    {countryOptions.find((c) => c.value === country)?.flag} {country}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From</span>
                  <span className="font-medium text-foreground">{pickupAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-medium text-foreground">{dropoffAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium text-foreground">{weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium text-foreground">{vehicleType}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Home
                  </Link>
                </Button>
                <Button
                  className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold"
                  onClick={() => {
                    setStep("form");
                    setTrackingId("");
                    setSenderName("");
                    setSenderPhone("");
                    setSenderEmail("");
                    setPickupAddress("");
                    setReceiverName("");
                    setReceiverPhone("");
                    setDropoffAddress("");
                    setWeight("");
                    setVehicleType("");
                    setNotes("");
                  }}
                >
                  Book Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-primary border-b border-primary">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Package className="h-7 w-7 text-secondary" />
            <span className="font-heading text-xl font-bold text-primary-foreground tracking-tight">
              Nation Courier
            </span>
          </Link>
          <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" asChild>
            <Link to="/">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Home
            </Link>
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Book a Shipment</h1>
            <p className="text-muted-foreground">
              Fill in the details below and get a tracking ID instantly. We operate across Kenya 🇰🇪, Uganda 🇺🇬, and Tanzania 🇹🇿.
            </p>
          </div>

          {/* Country & Vehicle */}
          <Card className="shadow-card mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Shipment Details</CardTitle>
              <CardDescription>Select country, vehicle type, and enter package weight.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.flag} {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleOptions.map((v) => (
                        <SelectItem key={v.value} value={v.value}>
                          {v.label} — {v.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="e.g. 5.0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sender */}
          <Card className="shadow-card mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-success" />
                </div>
                Sender (Pickup)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="John Mwangi" value={senderName} onChange={(e) => setSenderName(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="+254 7XX XXX XXX" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="john@example.com" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pickup Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-success" />
                  <Textarea placeholder="e.g. Nairobi CBD, Kimathi Street" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} className="pl-10 min-h-[60px]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receiver */}
          <Card className="shadow-card mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-destructive" />
                </div>
                Receiver (Drop-off)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Alice Nyambura" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="+254 7XX XXX XXX" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Drop-off Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-destructive" />
                  <Textarea placeholder="e.g. Westlands, Ring Road" value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} className="pl-10 min-h-[60px]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="shadow-card mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Additional Notes</CardTitle>
              <CardDescription>Any special handling instructions or details.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g. Fragile items, call before delivery, gate code: 1234..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              size="lg"
              disabled={!isValid}
              onClick={handleSubmit}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold px-10"
            >
              <Package className="h-5 w-5 mr-2" />
              Book Shipment
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookShipment;
