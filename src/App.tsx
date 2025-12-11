import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import MessagesLayout from "./pages/MessagesLayout";
import MessageThread from "./pages/MessageThread";
import NewMessageThread from "./pages/NewMessageThread";
import UserProfile from "./pages/UserProfile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Callback from "./pages/auth/Callback";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import PublishTrip from "./pages/publish/Trip";
import PublishParcel from "./pages/publish/Parcel";
import MyListings from "./pages/MyListings";
import MyReservations from "./pages/MyReservations";
import Favorites from "./pages/Favorites";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CGU from "./pages/CGU";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import ProhibitedItems from "./pages/ProhibitedItems";
import PaymentTest from "./pages/PaymentTest";
import AwwwardsLanding from "./pages/AwwwardsLanding";
import Notifications from "./pages/Notifications";

// Import admin utilities for console access (development only)
if (import.meta.env.DEV) {
  import("./utils/adminUtils");
}

const queryClient = new QueryClient();

const FooterWrapper = () => {
  const location = useLocation();
  // Afficher le footer uniquement sur /explorer
  if (location.pathname === '/explorer' || location.pathname === '/') {
    return <Footer />;
  }
  return null;
};

const MainWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Pas de padding-top sur mobile quand dans une conversation (navbar masquée)
  const isInConversation = location.pathname.startsWith('/messages/') && location.pathname !== '/messages';
  
  return (
    <main className={isInConversation ? "flex-1 pt-0 md:pt-28" : "flex-1 pt-24 md:pt-28"}>
      {children}
    </main>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen overflow-x-hidden">
          <Navigation />
          <OfflineBanner />
          <PWAInstallBanner />
          <MainWrapper>
            <div className="container mx-auto px-4 py-4">
              <SuspensionBanner />
            </div>
            <Routes>
        <Route path="/" element={<Explorer />} />
        <Route path="/home" element={<Home />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/trajets/:id" element={<TripDetail />} />
        <Route path="/colis/:id" element={<ParcelDetail />} />
        <Route path="/u/:userId" element={<UserProfile />} />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <MessagesLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<div className="hidden" />} />
                <Route path="new" element={<NewMessageThread />} />
                <Route path=":id" element={<MessageThread />} />
              </Route>
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
                path="/favoris"
                element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mes-reservations"
                element={
                  <ProtectedRoute>
                    <MyReservations />
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
              <Route path="/articles-interdits" element={<ProhibitedItems />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route
                path="/payment-test"
                element={
                  <AdminRoute>
                    <PaymentTest />
                  </AdminRoute>
                }
              />
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
          </MainWrapper>
          <FooterWrapper />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
