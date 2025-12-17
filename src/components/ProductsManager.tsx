import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Edit2, Save, X, Package, DollarSign, 
  TrendingUp, Clock, AlertCircle, Loader2 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Json } from '@/integrations/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  name: string;
  price: string;
  cost: string;
  category: string;
  description: string;
  unitsSoldPerMonth: string;
  productionTime: string;
}

const EMPTY_PRODUCT: Product = {
  name: '',
  price: '',
  cost: '',
  category: '',
  description: '',
  unitsSoldPerMonth: '',
  productionTime: '',
};

const CATEGORIES = [
  'Producto físico',
  'Producto digital',
  'Servicio',
  'Suscripción',
  'Consultoría',
  'Software',
  'Otro',
];

export default function ProductsManager() {
  const { t } = useTranslation();
  const { currentOrganizationId, userOrganizations } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const role = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role;
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const isAdmin = role === 'admin';

  useEffect(() => {
    if (currentOrganizationId) {
      fetchProducts();
    }
  }, [currentOrganizationId]);

  const fetchProducts = async () => {
    if (!currentOrganizationId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('products_services')
        .eq('id', currentOrganizationId)
        .single();

      if (error) throw error;

      const rawProducts = data?.products_services;
      if (Array.isArray(rawProducts)) {
        const parsed = rawProducts.map((p: unknown) => {
          const item = p as Record<string, unknown>;
          return {
            name: String(item.name || ''),
            price: String(item.price || ''),
            cost: String(item.cost || ''),
            category: String(item.category || ''),
            description: String(item.description || ''),
            unitsSoldPerMonth: String(item.unitsSoldPerMonth || ''),
            productionTime: String(item.productionTime || ''),
          };
        });
        setProducts(parsed);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProducts = async (newProducts: Product[]) => {
    if (!currentOrganizationId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ products_services: JSON.parse(JSON.stringify(newProducts)) as Json })
        .eq('id', currentOrganizationId);

      if (error) throw error;

      setProducts(newProducts);
      toast.success('Productos actualizados correctamente');
    } catch (error) {
      console.error('Error saving products:', error);
      toast.error('Error al guardar productos');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct({ ...EMPTY_PRODUCT });
    setEditingIndex(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (index: number) => {
    setEditingProduct({ ...products[index] });
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !editingProduct.name.trim()) {
      toast.error('El nombre del producto es obligatorio');
      return;
    }

    let newProducts: Product[];
    if (editingIndex !== null) {
      newProducts = products.map((p, i) => i === editingIndex ? editingProduct : p);
    } else {
      newProducts = [...products, editingProduct];
    }

    await saveProducts(newProducts);
    setIsDialogOpen(false);
    setEditingProduct(null);
    setEditingIndex(null);
  };

  const handleDeleteProduct = async () => {
    if (deleteIndex === null) return;

    const newProducts = products.filter((_, i) => i !== deleteIndex);
    await saveProducts(newProducts);
    setDeleteIndex(null);
  };

  const calculateMargin = (price: string, cost: string): string => {
    const p = parseFloat(price);
    const c = parseFloat(cost);
    if (isNaN(p) || isNaN(c) || p === 0) return '-';
    const margin = ((p - c) / p) * 100;
    return `${margin.toFixed(1)}%`;
  };

  const totalRevenue = products.reduce((sum, p) => {
    const price = parseFloat(p.price) || 0;
    const units = parseFloat(p.unitsSoldPerMonth) || 0;
    return sum + (price * units);
  }, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Productos y Servicios
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los productos/servicios de tu organización
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddProduct} className="gap-2">
            <Plus className="h-4 w-4" />
            Añadir Producto
          </Button>
        )}
      </div>

      {/* Stats */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="text-xl md:text-2xl font-bold mt-1">{products.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Ingresos/mes</span>
              </div>
              <p className="text-xl md:text-2xl font-bold mt-1">
                €{totalRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Promedio</span>
              </div>
              <p className="text-xl md:text-2xl font-bold mt-1">
                €{products.length > 0 
                  ? Math.round(products.reduce((s, p) => s + (parseFloat(p.price) || 0), 0) / products.length)
                  : 0}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/5 border-purple-500/20">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Categorías</span>
              </div>
              <p className="text-xl md:text-2xl font-bold mt-1">
                {new Set(products.map(p => p.category).filter(Boolean)).size}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No hay productos configurados</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {isAdmin 
                ? 'Añade tus productos o servicios para que aparezcan en el CRM y otros módulos.'
                : 'El administrador debe configurar los productos de la organización.'}
            </p>
            {isAdmin && (
              <Button onClick={handleAddProduct} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Añadir Primer Producto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product, index) => (
            <Card key={index} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">
                        {product.name}
                      </h3>
                      {product.category && (
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Precio:</span>{' '}
                        <span className="font-medium">€{product.price || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Costo:</span>{' '}
                        <span className="font-medium">€{product.cost || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Margen:</span>{' '}
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {calculateMargin(product.price, product.cost)}
                        </span>
                      </div>
                      {product.unitsSoldPerMonth && (
                        <div>
                          <span className="text-muted-foreground">Ventas/mes:</span>{' '}
                          <span className="font-medium">{product.unitsSoldPerMonth}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditProduct(index)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteIndex(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Editar Producto' : 'Añadir Producto'}
            </DialogTitle>
            <DialogDescription>
              Completa la información del producto o servicio
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Nombre del producto o servicio"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Costo (€)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={editingProduct.cost}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={editingProduct.category}
                  onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Descripción breve del producto"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitsSoldPerMonth">Ventas/mes</Label>
                  <Input
                    id="unitsSoldPerMonth"
                    type="number"
                    value={editingProduct.unitsSoldPerMonth}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unitsSoldPerMonth: e.target.value })}
                    placeholder="Unidades"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productionTime">Tiempo producción</Label>
                  <Input
                    id="productionTime"
                    value={editingProduct.productionTime}
                    onChange={(e) => setEditingProduct({ ...editingProduct, productionTime: e.target.value })}
                    placeholder="Ej: 2 días"
                  />
                </div>
              </div>

              {editingProduct.price && editingProduct.cost && (
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Margen calculado:{' '}
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {calculateMargin(editingProduct.price, editingProduct.cost)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar "{deleteIndex !== null ? products[deleteIndex]?.name : ''}"? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteIndex(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
