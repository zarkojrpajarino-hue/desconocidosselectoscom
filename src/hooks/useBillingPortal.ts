import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useBillingPortal() {
  const [loading, setLoading] = useState(false);

  const openBillingPortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-billing-portal");

      if (error) {
        // Handle specific error cases
        if (error.message?.includes("not owner")) {
          toast.error("Solo el propietario de la organización puede gestionar la facturación");
          return;
        }
        if (error.message?.includes("no subscription")) {
          toast.error("No hay una suscripción activa para gestionar");
          return;
        }
        throw error;
      }

      if (data?.url) {
        // Open in new window for better UX
        window.open(data.url, "_blank");
        toast.success("Portal de facturación abierto en nueva pestaña");
      } else {
        throw new Error("No se recibió URL del portal");
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
      toast.error("Error al abrir el portal de facturación");
    } finally {
      setLoading(false);
    }
  };

  return {
    openBillingPortal,
    loading,
  };
}
