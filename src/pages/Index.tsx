import { useState } from "react";
import { motion } from "framer-motion";
import { Package, MapPin, Search, Truck, Shield, Clock, ChevronRight, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import heroCourier from "@/assets/hero-courier.jpg";

const services = [
  {
    icon: Truck,
    title: "Same-Day Delivery",
    description: "Fast delivery across Kampala and surrounding areas within hours.",
  },
  {
    icon: Shield,
    title: "Secure Handling",
    description: "Every parcel insured and handled with care from pickup to delivery.",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description: "Track your package every step of the way with live status updates.",
  },
];

const statusSteps = ["Pending", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];

const Index = () => {
  const [trackingId, setTrackingId] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [weight, setWeight] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-primary">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Package className="h-7 w-7 text-secondary" />
            <span className="font-heading text-xl font-bold text-primary-foreground tracking-tight">
              Nation Courier
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-primary-foreground/80 text-sm font-medium">
            <a href="#quote" className="hover:text-secondary transition-colors">Get Quote</a>
            <a href="#track" className="hover:text-secondary transition-colors">Track Parcel</a>
            <a href="#services" className="hover:text-secondary transition-colors">Services</a>
            <a href="#contact" className="hover:text-secondary transition-colors">Contact</a>
          </div>
          <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold" asChild>
            <Link to="/book">Book Now</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 pt-16">
          <img src={heroCourier} alt="Nation Courier rider delivering in Kampala" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        </div>

        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-medium mb-6">
                <Truck className="h-4 w-4" /> Uganda's Trusted Courier
              </span>
              <h1 className="text-4xl md:text-6xl font-heading font-bold text-primary-foreground leading-tight mb-6">
                Delivering Across
                <br />
                <span className="text-secondary">Kampala & Beyond</span>
              </h1>
              <p className="text-lg text-primary-foreground/70 max-w-lg mb-8">
                Fast, reliable courier services with real-time tracking. From documents to bulk shipments — we move it all.
              </p>
            </motion.div>

            {/* Quick Quote Card */}
            <motion.div
              id="quote"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="bg-card rounded-xl p-6 shadow-elevated max-w-xl"
            >
              <h3 className="font-heading font-semibold text-card-foreground text-lg mb-4">Get an Instant Quote</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
                  <Input
                    placeholder="Pickup location"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                  <Input
                    placeholder="Drop-off location"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Input
                  placeholder="Weight (kg)"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="max-w-[140px]"
                />
                <Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading font-semibold">
                  Get Price <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Track Parcel */}
      <section id="track" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-xl mx-auto mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
              Track Your Parcel
            </h2>
            <p className="text-muted-foreground">
              Enter your tracking ID to see real-time delivery status.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-lg mx-auto"
          >
            <div className="flex gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. NC-2026-00142"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="pl-10 bg-card"
                />
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold">
                Track
              </Button>
            </div>

            {/* Status Preview */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-2">
                {statusSteps.map((step, i) => (
                  <div key={step} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        i <= 2
                          ? "bg-secondary border-secondary"
                          : "bg-muted border-border"
                      }`}
                    />
                    <span className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-center leading-tight">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative h-1 bg-muted rounded-full mt-1 mx-2">
                <div className="absolute left-0 top-0 h-full w-[50%] bg-secondary rounded-full" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
              Why Nation Courier?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Built for Uganda's logistics needs — speed, security, and visibility.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {services.map((svc, i) => (
              <motion.div
                key={svc.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow group"
              >
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                  <svc.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-heading font-semibold text-card-foreground text-lg mb-2">{svc.title}</h3>
                <p className="text-muted-foreground text-sm">{svc.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Footer */}
      <footer id="contact" className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-6 w-6 text-secondary" />
                <span className="font-heading text-xl font-bold">Nation Courier</span>
              </div>
              <p className="text-primary-foreground/60 text-sm">
                Fast & reliable courier services across Uganda. Moving your parcels with care since day one.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/60">
                <li><a href="#quote" className="hover:text-secondary transition-colors">Get a Quote</a></li>
                <li><a href="#track" className="hover:text-secondary transition-colors">Track Parcel</a></li>
                <li><a href="#services" className="hover:text-secondary transition-colors">Our Services</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Contact Us</h4>
              <div className="space-y-3 text-sm text-primary-foreground/60">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-secondary" />
                  <span>+256 700 000 000</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-secondary" />
                  <span>hello@nationcourier.ug</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-secondary" />
                  <span>Kampala, Uganda</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-xs text-primary-foreground/40">
            © 2026 Nation Courier. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
