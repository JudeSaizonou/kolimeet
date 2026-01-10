import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import Navigation from "./components/layout/Navigation";
import { BottomNavbar } from "./components/layout/BottomNavbar";
import { MobileHeader } from "./components/layout/MobileHeader";
import Footer from "./components/layout/Footer";
import { SuspensionBanner } from "@/components/SuspensionBanner";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { MessageNotificationListener } from "@/components/notifications/MessageNotificationListener";
import { useAuth } from "@/hooks/useAuth";
import Home from "./pages/Home";
import HomePage from "./pages/HomePage";
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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import ProhibitedItems from "./pages/ProhibitedItems";
import PaymentTest from "./pages/PaymentTest";
import Notifications from "./pages/Notifications";

// Import admin utilities for console access (development only)
if (import.meta.env.DEV) {
  import("./utils/adminUtils");
}

const queryClient = new QueryClient();

const FooterWrapper = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Afficher le footer uniquement sur /explorer et / mais pas sur mobile quand connecté
  if (location.pathname === '/explorer' || location.pathname === '/') {
    return (
      <div className={user ? "hidden md:block" : ""}>
        <Footer />
      </div>
    );
  }
  return null;
};

const MainWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Pas de padding-top sur mobile quand dans une conversation (navbar masquée)
  const isInConversation = location.pathname.startsWith('/messages/') && location.pathname !== '/messages';
  
  // Pages où le header mobile est affiché (uniquement Explorer et Favoris)
  const mobileHeaderPages = ['/', '/explorer', '/favoris'];
  const shouldShowMobileHeader = user && mobileHeaderPages.includes(location.pathname);
  
  // Pages où la bottom navbar est masquée (synchronisé avec BottomNavbar.tsx)
  const hiddenBottomNavPaths = ['/publier/', '/auth/', '/onboarding'];
  const shouldHideBottomNav = hiddenBottomNavPaths.some(path => location.pathname.startsWith(path));
  
  // Padding minimal - les pages gèrent leur propre espacement interne
  // Sur mobile connecté avec MobileHeader : pt-16
  // Sur mobile connecté sans MobileHeader : pt-0 (pages gèrent elles-mêmes)
  // Sur mobile non connecté : pt-0 (navbar flottante, pages gèrent le spacing)
  // Sur desktop : pt-0 (navbar flottante, pages gèrent leur padding-top)
  const topPadding = isInConversation 
    ? "pt-0" 
    : user 
      ? shouldShowMobileHeader
        ? "pt-16 md:pt-0"
        : "pt-0" 
      : "pt-0";
  
  // Bottom padding pour la bottom navbar (uniquement sur mobile et si connecté)
  const bottomPadding = !shouldHideBottomNav && user ? "pb-24 md:pb-0" : "";
  
  return (
    <main className={`flex-1 ${topPadding} ${bottomPadding}`}>
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
        <MessageNotificationListener />
        <div className="flex flex-col min-h-screen overflow-x-hidden">
          <Navigation />
          <MobileHeader />
          <OfflineBanner />
          <PWAInstallBanner />
          <MainWrapper>
            <SuspensionBanner />
            <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
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
              <Route path="/confidentialite" element={<PrivacyPolicy />} />
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
          <BottomNavbar />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
