import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";
import { SuspensionBanner } from "@/components/SuspensionBanner";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { OfflineBanner } from "@/components/OfflineBanner";
import Home from "./pages/Home";
import Explorer from "./pages/Explorer";
import TripDetail from "./pages/TripDetail";
import ParcelDetail from "./pages/ParcelDetail";
import Messages from "./pages/Messages";
import MessageThread from "./pages/MessageThread";
import UserProfile from "./pages/UserProfile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Callback from "./pages/auth/Callback";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import PublishTrip from "./pages/publish/Trip";
import PublishParcel from "./pages/publish/Parcel";
import MyListings from "./pages/MyListings";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CGU from "./pages/CGU";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import { RealTimeProvider } from "./components/RealTimeProvider";
import { UpdateNotification } from "./components/UpdateNotification";

// Import admin utilities for console access (development only)
if (import.meta.env.DEV) {
  import("./utils/adminUtils");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RealTimeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <OfflineBanner />
            <PWAInstallBanner />
            <UpdateNotification />
            <main className="flex-1">
            <div className="container mx-auto px-4 py-4">
              <SuspensionBanner />
            </div>
            <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/trajets/:id" element={<TripDetail />} />
        <Route path="/colis/:id" element={<ParcelDetail />} />
        <Route path="/u/:userId" element={<UserProfile />} />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/:id"
                element={
                  <ProtectedRoute>
                    <MessageThread />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/callback" element={<Callback />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profil"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/publier/trajet"
                element={
                  <ProtectedRoute>
                    <PublishTrip />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/publier/trajet/:id"
                element={
                  <ProtectedRoute>
                    <PublishTrip />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/publier/colis"
                element={
                  <ProtectedRoute>
                    <PublishParcel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/publier/colis/:id"
                element={
                  <ProtectedRoute>
                    <PublishParcel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mes-annonces"
                element={
                  <ProtectedRoute>
                    <MyListings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feedback"
                element={
                  <ProtectedRoute>
                    <Feedback />
                  </ProtectedRoute>
                }
              />
              <Route path="/cgu" element={<CGU />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
      </RealTimeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
