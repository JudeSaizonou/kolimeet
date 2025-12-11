import { Helmet } from "react-helmet";
import { useNotifications } from "@/hooks/useNotifications";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Package, MessageCircle, Star, ArrowLeft, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const navigate = useNavigate();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "match":
        return <Package className="h-5 w-5 text-primary" />;
      case "message":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "booking":
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Navigation en fonction du type de notification
    if (notification.related_type === "trip" && notification.related_id) {
      navigate(`/trajets/${notification.related_id}`);
    } else if (notification.related_type === "parcel" && notification.related_id) {
      navigate(`/colis/${notification.related_id}`);
    } else if (notification.related_type === "message" && notification.related_id) {
      navigate(`/messages/${notification.related_id}`);
    }
  };

  return (
    <ProtectedRoute>
      <Helmet>
        <title>Notifications - Kolimeet</title>
        <meta name="description" content="Gérez vos notifications sur Kolimeet" />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="space-y-3">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-4">Chargement...</p>
                </CardContent>
              </Card>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-semibold text-foreground mb-2">Aucune notification</h3>
                  <p className="text-sm text-muted-foreground">
                    Vous recevrez des notifications lorsque des trajets ou colis 
                    correspondront à vos annonces.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate("/explorer")}
                  >
                    Explorer les annonces
                  </Button>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.read ? 'border-primary/30 bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1 p-2 bg-muted rounded-full">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <Badge variant="default" className="text-xs">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Info supplémentaire */}
          {notifications.length > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-8">
              Les notifications sont générées automatiquement lorsque 
              des trajets ou colis correspondent à vos annonces.
            </p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Notifications;
