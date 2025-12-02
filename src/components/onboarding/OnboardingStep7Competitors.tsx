import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Target, TrendingUp } from "lucide-react";
import { OnboardingFormData } from "@/pages/Onboarding";

interface OnboardingStep7Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

export const OnboardingStep7Competitors = ({ formData, updateFormData }: OnboardingStep7Props) => {
  const addCompetitor = () => {
    updateFormData({
      topCompetitors: [
        ...formData.topCompetitors,
        { name: "", priceRange: "", strengths: "", weaknesses: "" }
      ]
    });
  };

  const removeCompetitor = (index: number) => {
    if (formData.topCompetitors.length > 1) {
      updateFormData({
        topCompetitors: formData.topCompetitors.filter((_, i) => i !== index)
      });
    }
  };

  const updateCompetitor = (index: number, field: string, value: string) => {
    const updated = [...formData.topCompetitors];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ topCompetitors: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Paso 7: Competencia y Mercado
        </h2>
        <p className="text-muted-foreground">
          Conocer tu competencia nos ayuda a posicionarte mejor
        </p>
      </div>

      {/* Competidores */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Principales Competidores *</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addCompetitor}
            disabled={formData.topCompetitors.length >= 5}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>

        {formData.topCompetitors.map((competitor, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Competidor {index + 1}</span>
              {formData.topCompetitors.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCompetitor(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`competitor-name-${index}`}>Nombre *</Label>
                <Input
                  id={`competitor-name-${index}`}
                  placeholder="Nombre de la empresa"
                  value={competitor.name}
                  onChange={(e) => updateCompetitor(index, "name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`competitor-price-${index}`}>Rango de precios</Label>
                <Input
                  id={`competitor-price-${index}`}
                  placeholder="Ej: €50-200/mes"
                  value={competitor.priceRange}
                  onChange={(e) => updateCompetitor(index, "priceRange", e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor={`competitor-strengths-${index}`}>¿Qué hacen mejor que tú?</Label>
              <Textarea
                id={`competitor-strengths-${index}`}
                placeholder="Sus fortalezas, ventajas competitivas..."
                value={competitor.strengths}
                onChange={(e) => updateCompetitor(index, "strengths", e.target.value)}
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor={`competitor-weaknesses-${index}`}>¿Qué haces mejor que ellos?</Label>
              <Textarea
                id={`competitor-weaknesses-${index}`}
                placeholder="Tus ventajas sobre este competidor..."
                value={competitor.weaknesses}
                onChange={(e) => updateCompetitor(index, "weaknesses", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Mínimo 2 competidores. Máximo 5.</p>
      </div>

      {/* Contexto de Mercado */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="marketSize">Tamaño del mercado</Label>
          <Input
            id="marketSize"
            placeholder="Ej: €500M en España, 10,000 empresas target..."
            value={formData.marketSize}
            onChange={(e) => updateFormData({ marketSize: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="marketGrowthRate">Crecimiento del mercado (%/año)</Label>
          <Input
            id="marketGrowthRate"
            placeholder="Ej: 15% anual"
            value={formData.marketGrowthRate}
            onChange={(e) => updateFormData({ marketGrowthRate: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="marketShareGoal">Meta de cuota de mercado en 12 meses (%)</Label>
        <Input
          id="marketShareGoal"
          type="number"
          min={0}
          max={100}
          placeholder="Ej: 5"
          value={formData.marketShareGoal || ""}
          onChange={(e) => updateFormData({ marketShareGoal: parseFloat(e.target.value) || 0 })}
        />
      </div>

      {/* Posicionamiento */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Posicionamiento
        </h3>
        
        <div>
          <Label htmlFor="pricingStrategy">Estrategia de precios *</Label>
          <Select 
            value={formData.pricingStrategy} 
            onValueChange={(value) => updateFormData({ pricingStrategy: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="¿Cómo te posicionas en precio?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="premium">Premium - Precio alto, máxima calidad</SelectItem>
              <SelectItem value="value">Value - Buena relación calidad-precio</SelectItem>
              <SelectItem value="competitive">Competitivo - Precios del mercado</SelectItem>
              <SelectItem value="economy">Económico - Precios bajos</SelectItem>
              <SelectItem value="freemium">Freemium - Gratis + premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="brandPerception">¿Cómo quieres que te perciban? (mín. 100 palabras)</Label>
          <Textarea
            id="brandPerception"
            placeholder="Describe la imagen de marca que quieres proyectar: valores, personalidad, tono de comunicación, emociones que quieres evocar..."
            value={formData.brandPerception}
            onChange={(e) => updateFormData({ brandPerception: e.target.value })}
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.brandPerception.split(/\s+/).filter(Boolean).length}/100 palabras
          </p>
        </div>
      </div>
    </div>
  );
};
