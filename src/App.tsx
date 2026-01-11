import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
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
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/hooks/useAuth";

// Eager load critical pages
import Home from "./pages/Home";
import HomePage from "./pages/HomePage";
import Explorer from "./pages/Explorer";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Lazy load non-critical pages
const TripDetail = lazy(() => import("./pages/TripDetail"));
const ParcelDetail = lazy(() => import("./pages/ParcelDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const MessagesLayout = lazy(() => import("./pages/MessagesLayout"));
const MessageThread = lazy(() => import("./pages/MessageThread"));
const NewMessageThread = lazy(() => import("./pages/NewMessageThread"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Callback = lazy(() => import("./pages/auth/Callback"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Profile = lazy(() => import("./pages/Profile"));
const PublishTrip = lazy(() => import("./pages/publish/Trip"));
const PublishParcel = lazy(() => import("./pages/publish/Parcel"));
const MyListings = lazy(() => import("./pages/MyListings"));
const MyReservations = lazy(() => import("./pages/MyReservations"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Feedback = lazy(() => import("./pages/Feedback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const CGU = lazy(() => import("./pages/CGU"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const ProhibitedItems = lazy(() => import("./pages/ProhibitedItems"));
const PaymentTest = lazy(() => import("./pages/PaymentTest"));
const Notifications = lazy(() => import("./pages/Notifications"));

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
      <HelmetProvider>
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
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </MainWrapper>
          <FooterWrapper />
          <BottomNavbar />
        </div>
      </BrowserRouter>
    </HelmetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
