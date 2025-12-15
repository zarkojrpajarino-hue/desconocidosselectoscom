/**
 * EJEMPLO COMPLETO: BuyerPersona con LockedFeature y ExportButton
 * ✅ CORREGIDO: Tokens semánticos para dark mode
 * ✅ CORREGIDO: Type safety mejorado
 * ✅ CORREGIDO: Sin colores hardcodeados
 * 
 * Este archivo muestra cómo implementar:
 * 1. ✅ Sistema de candados por plan
 * 2. ✅ ExportButton funcional
 * 3. ✅ Información de valor para upgrade
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useToolContent } from '@/hooks/useToolContent';
import { LockedFeature } from '@/components/LockedFeature';
import ExportButton from '@/components/ExportButton';
import ToolContentViewer from '@/components/ToolContentViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';

const BuyerPersona = () => {
  const { currentOrganizationId } = useAuth();
  const { plan, hasFeature, limits } = useSubscriptionLimits();
  
  // Hook para gestionar contenido de la herramienta
  const { 
    content, 
    loading, 
    generating, 
    generateContent, 
    hasContent,
    isAdmin 
  } = useToolContent('buyer_persona');

  // Estado local
  const [viewMode, setViewMode] = useState<'preview' | 'full'>('preview');

  // ============================================
  // VERIFICAR ACCESO AL FEATURE
  // ============================================
  
  // Verificar si tiene acceso a la herramienta
  const canAccess = hasFeature('available_ai_tools') && 
                    limits.available_ai_tools.includes('buyer_persona');

  // Si NO tiene acceso → Mostrar LockedFeature
  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-12 pb-20 md:pb-12">
        <LockedFeature
          featureName="Buyer Persona Generator"
          description="Crea buyer personas detallados en minutos usando IA"
          detailedDescription="Nuestra IA analiza tu mercado objetivo y genera perfiles completos de buyer personas con datos demográficos, psicográficos, pain points, objetivos y comportamientos de compra. Todo basado en investigación real de mercado."
          requiredPlan="starter"
          icon={<User className="h-6 w-6" />}
          benefits={[
            'Generación automática con IA avanzada',
            'Perfiles demográficos completos',
            'Pain points y motivaciones',
            'Comportamientos de compra',
            'Canales preferidos de comunicación',
            'Exportar en múltiples formatos (PDF, JSON)'
          ]}
          useCases={[
            'Startups definiendo su cliente ideal',
            'Equipos de marketing creando campañas personalizadas',
            'Ventas entendiendo mejor a sus prospectos',
            'Product managers diseñando features',
            'Founders preparando pitches a inversores'
          ]}
          variant="card"
          size="lg"
        />

        {/* Información adicional sobre el feature */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Proporciona información básica sobre tu negocio</p>
              <p>2. La IA analiza datos de mercado y tendencias</p>
              <p>3. Genera perfiles detallados de tus clientes ideales</p>
              <p>4. Exporta y comparte con tu equipo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos que incluye</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Demografía (edad, ubicación, educación)</p>
              <p>• Psicografía (valores, intereses, lifestyle)</p>
              <p>• Pain points y frustraciones</p>
              <p>• Objetivos y motivaciones</p>
              <p>• Canales preferidos</p>
              <p>• Comportamiento de compra</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================
  // SI TIENE ACCESO → Mostrar herramienta
  // ============================================

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-20 md:pb-8">
      {/* Header con título y acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
            <User className="h-6 w-6 md:h-8 md:w-8" />
            Buyer Persona Generator
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Crea perfiles detallados de tus clientes ideales con IA
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          {/* Badge del plan actual */}
          <Badge variant="secondary" className="h-9 px-3">
            Plan {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </Badge>

          {/* Botón para generar */}
          {isAdmin && (
            <Button
              onClick={generateContent}
              disabled={generating || loading}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {hasContent ? 'Regenerar' : 'Generar Persona'}
            </Button>
          )}

          {/* ✅ EXPORTBUTTON - Solo si hay contenido */}
          {hasContent && content && (
            <ExportButton
              exportType="tool-content"
              data={content}
              metadata={{
                title: 'Buyer Persona',
                organizationName: currentOrganizationId || '',
                dateRange: new Date().toLocaleDateString()
              }}
              availableFormats={['pdf', 'json']}
              buttonText="Exportar"
              variant="outline"
              iconOnly={false}
            />
          )}
        </div>
      </div>

      {/* Contenido principal */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      ) : generating ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Sparkles className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Generando tu Buyer Persona...</p>
            <p className="text-sm text-muted-foreground">Esto puede tomar 30-60 segundos</p>
          </div>
        </div>
      ) : hasContent && content ? (
        <>
          {/* Vista del contenido */}
          <Card>
            <CardContent className="pt-6">
              <pre className="whitespace-pre-wrap text-sm">
                {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* CTA para exportar (complementario) */}
          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">¿Listo para usar tu Buyer Persona?</h3>
                <p className="text-sm text-muted-foreground">
                  Exporta en PDF para compartir con tu equipo o en JSON para integraciones
                </p>
              </div>
              <ExportButton
                exportType="tool-content"
                data={content}
                metadata={{
                  title: 'Buyer Persona',
                  organizationName: currentOrganizationId || '',
                }}
                availableFormats={['pdf', 'json']}
                buttonText="Descargar"
                size="lg"
              />
            </CardContent>
          </Card>
        </>
      ) : (
        /* Estado vacío - no hay contenido todavía */
        <Card className="border-dashed border-2">
          <CardContent className="pt-12 pb-12 text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Aún no has generado tu Buyer Persona
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {isAdmin 
                ? 'Haz click en "Generar Persona" para crear tu primer buyer persona con IA'
                : 'Contacta con un administrador para generar el buyer persona de tu organización'
              }
            </p>
            {isAdmin && (
              <Button onClick={generateContent} size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Generar mi Primer Persona
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info sobre límites de uso */}
      {limits.max_ai_analysis_per_month !== -1 && (
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-4 pb-4 text-sm text-muted-foreground text-center">
            💡 Tienes {limits.max_ai_analysis_per_month} generaciones IA disponibles este mes
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BuyerPersona;

/**
 * CÓMO APLICAR ESTE PATRÓN A OTRAS HERRAMIENTAS:
 * 
 * 1. CustomerJourney.tsx
 *    - Cambiar 'buyer_persona' → 'customer_journey'
 *    - Cambiar requiredPlan → 'starter'
 *    - Actualizar beneficios y casos de uso
 * 
 * 2. WebGenerator.tsx
 *    - Cambiar 'buyer_persona' → 'web_generator'
 *    - Cambiar requiredPlan → 'professional'
 *    - Actualizar beneficios y casos de uso
 * 
 * 3. BrandKit.tsx
 *    - Cambiar 'buyer_persona' → 'brand_kit'
 *    - Cambiar requiredPlan → 'professional'
 *    - Actualizar beneficios y casos de uso
 * 
 * 4. Simulador.tsx
 *    - Cambiar 'buyer_persona' → 'sales_simulator'
 *    - Cambiar requiredPlan → 'professional'
 *    - Actualizar beneficios y casos de uso
 * 
 * El patrón es EXACTAMENTE el mismo para todas!
 */
