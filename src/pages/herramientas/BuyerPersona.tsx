import ToolContentViewer from '@/components/ToolContentViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCountryData } from '@/hooks/useCountryData';
import { MapPin, Briefcase, Target, Zap, Heart, MessageCircle, ShoppingCart } from 'lucide-react';

// Types for BuyerPersona
interface Demographics { education?: string; family_status?: string; housing?: string }
interface Psychographics { values?: string[]; interests?: string[]; lifestyle?: string }
interface BuyingBehavior {
  decision_factors?: string[]; buying_frequency?: string;
  price_sensitivity?: string; preferred_payment_methods?: string[];
}
interface PersonaData {
  name?: string; age?: number; occupation?: string; location?: string;
  country_code?: string; income_range?: string; quote?: string;
  demographics?: Demographics; goals?: string[]; pain_points?: string[];
  psychographics?: Psychographics; preferred_channels?: string[];
  buying_behavior?: BuyingBehavior;
  values?: string[]; challenges?: string[]; channels?: string[];
}

const BuyerPersona = () => {
  const { getCountryByCode } = useCountryData();

  const renderContent = (persona: PersonaData) => {
    if (!persona) return null;

    const countryData = persona.country_code ? getCountryByCode(persona.country_code) : null;

    return (
      <div className="grid gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl md:text-2xl">{persona.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1 text-muted-foreground text-sm">
                  <span>{persona.age} años</span>
                  <span>•</span>
                  <span>{persona.occupation}</span>
                </div>
                {persona.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{persona.location}</span>
                  </div>
                )}
              </div>
              {persona.income_range && (
                <Badge variant="secondary" className="text-sm">
                  {persona.income_range}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quote / Descripción */}
            {persona.quote && (
              <div className="bg-muted/50 p-4 rounded-lg italic border-l-4 border-primary">
                "{persona.quote}"
              </div>
            )}

            {/* Demografía */}
            {persona.demographics && Object.keys(persona.demographics).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Demografía
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {persona.demographics.education && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Educación</p>
                      <p className="font-medium">{persona.demographics.education}</p>
                    </div>
                  )}
                  {persona.demographics.family_status && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Estado familiar</p>
                      <p className="font-medium">{persona.demographics.family_status}</p>
                    </div>
                  )}
                  {persona.demographics.housing && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Vivienda</p>
                      <p className="font-medium">{persona.demographics.housing}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Objetivos */}
            {persona.goals && persona.goals.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Objetivos
                </h3>
                <ul className="space-y-2">
                  {persona.goals.map((goal: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Desafíos / Pain Points */}
            {persona.pain_points && persona.pain_points.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-destructive" />
                  Desafíos
                </h3>
                <ul className="space-y-2">
                  {persona.pain_points.map((challenge: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Psicografía */}
            {persona.psychographics && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Psicografía
                </h3>
                <div className="space-y-3">
                  {persona.psychographics.values && persona.psychographics.values.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Valores</p>
                      <div className="flex flex-wrap gap-2">
                        {persona.psychographics.values.map((value: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {persona.psychographics.interests && persona.psychographics.interests.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Intereses</p>
                      <div className="flex flex-wrap gap-2">
                        {persona.psychographics.interests.map((interest: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {persona.psychographics.lifestyle && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estilo de vida</p>
                      <p className="text-sm">{persona.psychographics.lifestyle}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Canales Preferidos */}
            {persona.preferred_channels && persona.preferred_channels.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Canales Preferidos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {persona.preferred_channels.map((channel: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="border-primary/30">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Comportamiento de Compra */}
            {persona.buying_behavior && Object.keys(persona.buying_behavior).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Comportamiento de Compra
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {persona.buying_behavior.decision_factors && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Factores de decisión</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.buying_behavior.decision_factors.map((factor: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {persona.buying_behavior.buying_frequency && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Frecuencia de compra</p>
                      <p className="font-medium">{persona.buying_behavior.buying_frequency}</p>
                    </div>
                  )}
                  {persona.buying_behavior.price_sensitivity && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Sensibilidad al precio</p>
                      <p className="font-medium capitalize">{persona.buying_behavior.price_sensitivity}</p>
                    </div>
                  )}
                  {persona.buying_behavior.preferred_payment_methods && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Métodos de pago preferidos</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.buying_behavior.preferred_payment_methods.map((method: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contexto del país */}
            {countryData && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Contexto de Mercado ({countryData.country_name})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-primary/5 p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">IVA</p>
                    <p className="font-bold text-primary">{countryData.vat_rate}%</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Internet</p>
                    <p className="font-bold text-primary">{countryData.internet_penetration}%</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">E-commerce</p>
                    <p className="font-bold text-primary">{countryData.ecommerce_penetration}%</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Edad Media</p>
                    <p className="font-bold text-primary">{countryData.median_age} años</p>
                  </div>
                </div>
              </div>
            )}

            {/* Legacy fields (for backwards compatibility) */}
            {persona.values && Array.isArray(persona.values) && !persona.psychographics && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Valores
                </h3>
                <div className="flex flex-wrap gap-2">
                  {persona.values.map((value: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {persona.challenges && Array.isArray(persona.challenges) && !persona.pain_points && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-destructive" />
                  Desafíos
                </h3>
                <ul className="space-y-2">
                  {persona.challenges.map((challenge: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-destructive mt-1">•</span>
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {persona.channels && Array.isArray(persona.channels) && !persona.preferred_channels && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Canales Preferidos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {persona.channels.map((channel: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <ToolContentViewer
      toolType="buyer_persona"
      title="Buyer Persona"
      description="Perfil detallado del cliente ideal para enfocar estrategias de marketing y ventas"
      renderContent={renderContent}
    />
  );
};

export default BuyerPersona;
