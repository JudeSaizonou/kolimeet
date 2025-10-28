import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminFlags } from "./AdminFlags";
import { AdminUsers } from "./AdminUsers";
import { AdminListings } from "./AdminListings";
import { AdminReviews } from "./AdminReviews";
import { Shield } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-secondary">
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Administration</h1>
              <p className="text-sm text-muted-foreground">Modération et gestion de la plateforme</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="flags" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="flags">Signalements</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="listings">Annonces</TabsTrigger>
            <TabsTrigger value="reviews">Avis</TabsTrigger>
          </TabsList>

          <TabsContent value="flags" className="mt-0">
            <AdminFlags />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="listings" className="mt-0">
            <AdminListings />
          </TabsContent>

          <TabsContent value="reviews" className="mt-0">
            <AdminReviews />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
