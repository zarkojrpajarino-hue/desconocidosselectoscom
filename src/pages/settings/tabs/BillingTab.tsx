import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, ExternalLink, AlertCircle, Check, Calendar } from "lucide-react";
import { useBillingPortal } from "@/hooks/useBillingPortal";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function BillingTab() {
  const { user, currentOrganizationId } = useAuth();
  const { openBillingPortal, loading } = useBillingPortal();

  // Get organization billing info
  const { data: org, isLoading } = useQuery({
    queryKey: ["organization-billing", currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*, user_roles!inner(user_id, role)")
        .eq("id", currentOrganizationId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganizationId,
  });

  // Check if current user is owner (admin)
  const isOwner = org?.user_roles?.some(
    (role: { user_id: string; role: string }) => 
      role.user_id === user?.id && role.role === "admin"
  );

  const hasActiveSubscription = org?.subscription_status === "active" && org?.stripe_customer_id;

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "enterprise": return "default";
      case "professional": return "default";
      case "starter": return "secondary";
      default: return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case "active": return "default";
      case "trialing": return "secondary";
      case "past_due": return "destructive";
      case "canceled": return "outline";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Plan Actual
          </CardTitle>
          <CardDescription>
            Información de tu suscripción actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Plan</span>
            <Badge variant={getPlanBadgeVariant(org?.plan || "free")}>
              {org?.plan?.toUpperCase() || "FREE"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estado</span>
            <Badge variant={getStatusBadgeVariant(org?.subscription_status)}>
              {org?.subscription_status === "active" ? "Activo" :
               org?.subscription_status === "trialing" ? "Prueba" :
               org?.subscription_status === "past_due" ? "Pago pendiente" :
               org?.subscription_status === "canceled" ? "Cancelado" :
               "Sin suscripción"}
            </Badge>
          </div>

          {org?.trial_ends_at && new Date(org.trial_ends_at) > new Date() && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Trial termina
              </span>
              <span className="font-medium">
                {format(new Date(org.trial_ends_at), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Portal */}
      <Card>
        <CardHeader>
          <CardTitle>Portal de Facturación</CardTitle>
          <CardDescription>
            Gestiona tu suscripción, métodos de pago y facturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isOwner && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Acceso restringido</AlertTitle>
              <AlertDescription>
                Solo el propietario de la organización puede gestionar la facturación.
              </AlertDescription>
            </Alert>
          )}

          {isOwner && !hasActiveSubscription && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sin suscripción activa</AlertTitle>
              <AlertDescription>
                No tienes una suscripción activa. Actualiza a un plan de pago para acceder al portal de facturación.
              </AlertDescription>
            </Alert>
          )}

          {isOwner && hasActiveSubscription && (
            <>
              <Button 
                onClick={openBillingPortal} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  "Abriendo..."
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Portal de Facturación
                  </>
                )}
              </Button>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">En el portal podrás:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Cambiar tu método de pago
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Ver y descargar facturas
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Actualizar datos de facturación
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Cambiar o cancelar tu plan
                  </li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
