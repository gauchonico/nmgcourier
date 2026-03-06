import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BookShipment from "./pages/BookShipment";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import DashboardOverview from "./pages/admin/DashboardOverview";
import ShipmentBoard from "./pages/admin/ShipmentBoard";
import RiderManagement from "./pages/admin/RiderManagement";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import AdminLogin from "./pages/admin/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import PricingManager from "./pages/admin/PricingManager";
import RiderProfile from "./pages/admin/RiderProfile";
import EarningsConfig from "./pages/admin/EarningsConfig";
import FleetManagement from "./pages/admin/FleetManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/book" element={<BookShipment />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="shipments" element={<ShipmentBoard />} />
            <Route path="riders" element={<RiderManagement />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="pricing" element={<PricingManager />} />
            <Route path="riders/:id" element={<RiderProfile />} />
            <Route path="earnings" element={<EarningsConfig />} />
            <Route path="fleet" element={<FleetManagement />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;