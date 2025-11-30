import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { OnboardingFormData } from "@/pages/Onboarding";
import { Plus, Trash2 } from "lucide-react";

interface OnboardingStep4Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

export const OnboardingStep4 = ({ formData, updateFormData }: OnboardingStep4Props) => {
  const addProduct = () => {
    updateFormData({
      productsServices: [...formData.productsServices, { name: "", price: "", category: "", description: "" }]
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paso 4: Productos y Servicios</h2>
        <p className="text-muted-foreground">
          Lista todos los productos/servicios que ofreces
        </p>
      </div>

      <div className="space-y-6">
        {formData.productsServices.map((product, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4 relative">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Producto/Servicio #{index + 1}</h3>
              {index > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(index)}
                  className="text-red-500 hover:text-red-700"
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
                <Label htmlFor={`product-price-${index}`}>Precio *</Label>
                <Input
                  id={`product-price-${index}`}
                  placeholder="Ej: 8.500€ o desde 250€/mes"
                  value={product.price}
                  onChange={(e) => updateProduct(index, 'price', e.target.value)}
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