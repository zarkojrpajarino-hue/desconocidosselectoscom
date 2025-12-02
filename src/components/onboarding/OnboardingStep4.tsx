import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { OnboardingFormData } from "@/pages/Onboarding";
import { Plus, Trash2, Package, DollarSign } from "lucide-react";

interface OnboardingStep4Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

export const OnboardingStep4 = ({ formData, updateFormData }: OnboardingStep4Props) => {
  const addProduct = () => {
    updateFormData({
      productsServices: [...formData.productsServices, { 
        name: "", price: "", category: "", description: "", 
        cost: "", unitsSoldPerMonth: "", productionTime: "" 
      }]
    });
  };

  const removeProduct = (index: number) => {
    const updated = formData.productsServices.filter((_, i) => i !== index);
    updateFormData({ productsServices: updated });
  };

  const updateProduct = (index: number, field: string, value: string) => {
    const updated = formData.productsServices.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    updateFormData({ productsServices: updated });
  };

  // Calcular margen automático
  const calculateMargin = (price: string, cost: string): string => {
    const priceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
    const costNum = parseFloat(cost.replace(/[^0-9.]/g, ''));
    if (!priceNum || !costNum || priceNum === 0) return "-";
    const margin = ((priceNum - costNum) / priceNum) * 100;
    return `${margin.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Paso 4: Productos y Servicios
        </h2>
        <p className="text-muted-foreground">
          Lista todos los productos/servicios que ofreces con sus costes
        </p>
      </div>

      <div className="space-y-6">
        {formData.productsServices.map((product, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4 relative bg-muted/20">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Producto/Servicio #{index + 1}</h3>
              {index > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(index)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`product-name-${index}`}>Nombre *</Label>
                <Input
                  id={`product-name-${index}`}
                  placeholder="Ej: Instalación Paneles Solares Premium"
                  value={product.name}
                  onChange={(e) => updateProduct(index, 'name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor={`product-category-${index}`}>Categoría *</Label>
                <Input
                  id={`product-category-${index}`}
                  placeholder="Ej: Premium, Estándar, Empresarial..."
                  value={product.category}
                  onChange={(e) => updateProduct(index, 'category', e.target.value)}
                  required
                />
              </div>

              {/* Bloque de Finanzas */}
              <div className="md:col-span-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Datos Financieros (⚠️ Críticos para proyecciones)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label htmlFor={`product-price-${index}`} className="text-xs">Precio Venta *</Label>
                    <Input
                      id={`product-price-${index}`}
                      placeholder="Ej: 8500€"
                      value={product.price}
                      onChange={(e) => updateProduct(index, 'price', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`product-cost-${index}`} className="text-xs">Coste Directo *</Label>
                    <Input
                      id={`product-cost-${index}`}
                      placeholder="Ej: 5000€"
                      value={product.cost}
                      onChange={(e) => updateProduct(index, 'cost', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Margen</Label>
                    <div className="h-10 px-3 py-2 border rounded-md bg-muted text-sm flex items-center font-medium">
                      {calculateMargin(product.price, product.cost)}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`product-units-${index}`} className="text-xs">Uds/mes vendidas *</Label>
                    <Input
                      id={`product-units-${index}`}
                      type="number"
                      placeholder="Ej: 15"
                      value={product.unitsSoldPerMonth}
                      onChange={(e) => updateProduct(index, 'unitsSoldPerMonth', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor={`product-time-${index}`}>Tiempo producción/entrega (días)</Label>
                <Input
                  id={`product-time-${index}`}
                  type="number"
                  placeholder="Ej: 3"
                  value={product.productionTime}
                  onChange={(e) => updateProduct(index, 'productionTime', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor={`product-description-${index}`}>Descripción *</Label>
                <Textarea
                  id={`product-description-${index}`}
                  placeholder="Ej: Incluye 12 paneles de 400W, inversor híbrido, instalación completa, garantía 25 años, monitorización app..."
                  value={product.description}
                  onChange={(e) => updateProduct(index, 'description', e.target.value)}
                  className="min-h-[80px]"
                  required
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addProduct}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Otro Producto/Servicio
        </Button>
      </div>
    </div>
  );
};
