import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  User,
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

interface Ticket {
  id: string;
  user_id: string;
  user_name: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_role: string | null;
  message: string;
  created_at: string;
}

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
}

export default function Support() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = useAdmin();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [threadOpen, setThreadOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  
  const [messageText, setMessageText] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [adminToAssign, setAdminToAssign] = useState<string>("");
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchTickets();
    fetchCannedResponses();
    fetchAdminUsers();
  }, [statusFilter, categoryFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("support_tickets")
        .select(`
          *,
          user:profiles!support_tickets_user_id_fkey(full_name),
          assigned:profiles!support_tickets_assigned_to_fkey(full_name),
          message_count:support_messages(count)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTickets(
        (data || []).map((ticket: any) => ({
          id: ticket.id,
          user_id: ticket.user_id,
          user_name: ticket.user?.full_name || null,
          subject: ticket.subject,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          assigned_to: ticket.assigned_to,
          assigned_name: ticket.assigned?.full_name || null,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          message_count: ticket.message_count?.[0]?.count || 0,
        }))
      );
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select(`
          *,
          sender:profiles!support_messages_sender_id_fkey(full_name, role)
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setTicketMessages(
        (data || []).map((msg: any) => ({
          id: msg.id,
          ticket_id: msg.ticket_id,
          sender_id: msg.sender_id,
          sender_name: msg.sender?.full_name || null,
          sender_role: msg.sender?.role || null,
          message: msg.message,
          created_at: msg.created_at,
        }))
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchCannedResponses = async () => {
    try {
      const { data, error } = await supabase
        .from("canned_responses")
        .select("*")
        .order("title");

      if (error) throw error;
      setCannedResponses(data || []);
    } catch (error) {
      console.error("Error fetching canned responses:", error);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id, role, profiles(full_name)")
        .in("role", ["super_admin", "moderator", "support"])
        .eq("is_active", true);

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  };

  const handleOpenThread = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await fetchTicketMessages(ticket.id);
    setThreadOpen(true);
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !messageText.trim() || !user?.id) return;

    try {
      const { error: messageError } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          message: messageText.trim(),
          is_internal: false,
        });

      if (messageError) throw messageError;

      // Refresh messages
      await fetchTicketMessages(selectedTicket.id);
      setMessageText("");

      toast({
        title: "Message envoyé",
        description: "Votre réponse a été envoyée",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedTicket || !adminToAssign) return;

    try {
      const { error } = await supabase.rpc("admin_assign_ticket" as any, {
        p_ticket_id: selectedTicket.id,
        p_admin_id: adminToAssign,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Ticket assigné",
      });

      setAssignDialogOpen(false);
      setAdminToAssign("");
      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'assigner le ticket",
        variant: "destructive",
      });
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase.rpc("admin_resolve_ticket" as any, {
        p_ticket_id: selectedTicket.id,
        p_resolution_notes: resolutionNotes || "Ticket résolu",
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Ticket résolu",
      });

      setResolveDialogOpen(false);
      setResolutionNotes("");
      setThreadOpen(false);
      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de résoudre le ticket",
        variant: "destructive",
      });
    }
  };

  const insertCannedResponse = (response: CannedResponse) => {
    setMessageText((prev) => prev + (prev ? "\n\n" : "") + response.content);
  };

  const columns: ColumnDef<Ticket>[] = [
    {
      accessorKey: "subject",
      header: "Sujet",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium"
          onClick={() => handleOpenThread(row.original)}
        >
          {row.original.subject}
        </Button>
      ),
    },
    {
      accessorKey: "user_name",
      header: "Utilisateur",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={() => navigate(`/admin/users/${row.original.user_id}`)}
        >
          {row.original.user_name || "Inconnu"}
        </Button>
      ),
    },
    {
      accessorKey: "category",
      header: "Catégorie",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.category}</Badge>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priorité",
      cell: ({ row }) => {
        const priorityConfig: Record<string, { variant: any }> = {
          low: { variant: "secondary" },
          medium: { variant: "default" },
          high: { variant: "destructive" },
          critical: { variant: "destructive" },
        };
        const config = priorityConfig[row.original.priority] || {
          variant: "outline",
        };
        return (
          <Badge variant={config.variant}>{row.original.priority}</Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const statusConfig: Record<string, { variant: any; icon: any }> = {
          open: { variant: "destructive", icon: Clock },
          in_progress: { variant: "default", icon: RefreshCw },
          resolved: { variant: "secondary", icon: CheckCircle },
          closed: { variant: "outline", icon: XCircle },
        };
        const config = statusConfig[row.original.status] || {
          variant: "outline",
          icon: MessageSquare,
        };
        const Icon = config.icon;
        return (
          <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "assigned_name",
      header: "Assigné à",
      cell: ({ row }) => row.original.assigned_name || "-",
    },
    {
      accessorKey: "message_count",
      header: "Messages",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.message_count}</Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString("fr-FR"),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.status !== "resolved" && hasPermission("support") && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTicket(row.original);
                  setAssignDialogOpen(true);
                }}
              >
                Assigner
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTicket(row.original);
                  setResolveDialogOpen(true);
                }}
              >
                Résoudre
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Client</h1>
          <p className="text-muted-foreground mt-1">
            {tickets.length} ticket(s)
          </p>
        </div>
        <Button onClick={fetchTickets} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="open">Ouverts</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="resolved">Résolus</SelectItem>
            <SelectItem value="closed">Fermés</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="technical">Technique</SelectItem>
            <SelectItem value="payment">Paiement</SelectItem>
            <SelectItem value="account">Compte</SelectItem>
            <SelectItem value="abuse">Abus</SelectItem>
            <SelectItem value="other">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tickets}
        searchKey="subject"
        searchPlaceholder="Rechercher par sujet..."
      />

      {/* Ticket Thread Sheet */}
      <Sheet open={threadOpen} onOpenChange={setThreadOpen}>
        <SheetContent className="sm:max-w-2xl w-full">
          <SheetHeader>
            <SheetTitle>{selectedTicket?.subject}</SheetTitle>
            <SheetDescription>
              {selectedTicket?.category} • {selectedTicket?.priority}
            </SheetDescription>
          </SheetHeader>

          {selectedTicket && (
            <div className="flex flex-col h-[calc(100vh-200px)] mt-4">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {ticketMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.sender_role === "admin" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.sender_role === "admin"
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      >
                        <User className="h-4 w-4" />
                      </div>
                      <div
                        className={`flex-1 ${
                          msg.sender_role === "admin" ? "text-right" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {msg.sender_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleString("fr-FR")}
                          </span>
                        </div>
                        <div
                          className={`inline-block px-4 py-2 rounded-lg ${
                            msg.sender_role === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Canned Responses */}
              {hasPermission("support") && cannedResponses.length > 0 && (
                <div className="mt-4 mb-2">
                  <Label className="text-xs text-muted-foreground">
                    Réponses prédéfinies
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {cannedResponses
                      .filter(
                        (r) =>
                          r.category === "all" ||
                          r.category === selectedTicket.category
                      )
                      .map((response) => (
                        <Button
                          key={response.id}
                          variant="outline"
                          size="sm"
                          onClick={() => insertCannedResponse(response)}
                        >
                          {response.title}
                        </Button>
                      ))}
                  </div>
                </div>
              )}

              {/* Message Input */}
              {hasPermission("support") && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Tapez votre réponse..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner le ticket</DialogTitle>
            <DialogDescription>
              Choisissez un administrateur pour gérer ce ticket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin">Administrateur</Label>
              <Select value={adminToAssign} onValueChange={setAdminToAssign}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {adminUsers.map((admin: any) => (
                    <SelectItem key={admin.user_id} value={admin.user_id}>
                      {admin.profiles?.full_name || "Sans nom"} ({admin.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleAssignTicket} disabled={!adminToAssign}>
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résoudre le ticket</DialogTitle>
            <DialogDescription>
              Marquer ce ticket comme résolu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes de résolution</Label>
              <Textarea
                id="notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Détails de la résolution..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleResolveTicket}>Résoudre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
