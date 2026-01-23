import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Link2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoleInvitation {
  id: string;
  token: string;
  custom_slug: string | null;
  slug_type: string;
  organization_name: string;
}

interface Props {
  invitation: RoleInvitation;
  onUpdate?: () => void;
}

type SlugType = 'auto' | 'organization_name' | 'custom';

export default function RoleInvitationCardWithSlug({ invitation, onUpdate }: Props) {
  const [slugType, setSlugType] = useState<SlugType>((invitation.slug_type as SlugType) || 'auto');
  const [customSlug, setCustomSlug] = useState(invitation.custom_slug || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (slugType === 'organization_name') {
      const orgSlug = slugify(invitation.organization_name);
      setCustomSlug(orgSlug);
    } else if (slugType === 'auto') {
      setCustomSlug('');
    }
  }, [slugType, invitation.organization_name]);

  useEffect(() => {
    if (slugType === 'custom' && customSlug) {
      validateSlug(customSlug);
    } else {
      setValidationError('');
    }
  }, [customSlug, slugType]);

  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  };

  const validateSlug = (slug: string) => {
    if (slug.length < 3) {
      setValidationError('Mínimo 3 caracteres');
      return false;
    }
    if (slug.length > 50) {
      setValidationError('Máximo 50 caracteres');
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setValidationError('Solo letras minúsculas, números y guiones');
      return false;
    }
    if (slug.startsWith('-') || slug.endsWith('-')) {
      setValidationError('No puede empezar ni terminar con guión');
      return false;
    }
    setValidationError('');
    return true;
  };

  const getInvitationLink = () => {
    const baseUrl = window.location.origin;
    if (slugType === 'auto' || !customSlug) {
      return `${baseUrl}/join/${invitation.token}`;
    }
    return `${baseUrl}/join/${customSlug}`;
  };

  const handleUpdateSlug = async () => {
    setIsSaving(true);
    try {
      if (slugType === 'custom' && customSlug && !validateSlug(customSlug)) {
        toast.error('Slug inválido');
        setIsSaving(false);
        return;
      }

      if (slugType === 'custom' && customSlug) {
        const { data: existing } = await supabase
          .from('organization_invitations')
          .select('id')
          .eq('custom_slug', customSlug)
          .neq('id', invitation.id)
          .maybeSingle();

        if (existing) {
          setValidationError('Este slug ya está en uso');
          setIsSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from('organization_invitations')
        .update({
          slug_type: slugType,
          custom_slug: slugType === 'auto' ? null : customSlug
        })
        .eq('id', invitation.id);

      if (error) throw error;

      toast.success('Link actualizado');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating slug:', error);
      toast.error('Error al actualizar link');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    const link = getInvitationLink();
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    toast.success('Link copiado al portapapeles');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Link de Invitación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de Slug */}
        <div className="space-y-3">
          <Label>Tipo de Link</Label>
          <RadioGroup value={slugType} onValueChange={(value) => setSlugType(value as SlugType)}>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="auto" id="auto" className="mt-1" />
                <Label htmlFor="auto" className="font-normal cursor-pointer">
                  <div>
                    <span className="font-semibold">Código Aleatorio</span>
                    <p className="text-sm text-muted-foreground">
                      Seguro pero difícil de recordar
                    </p>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">
                      {window.location.origin}/join/{invitation.token.substring(0, 12)}...
                    </code>
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <RadioGroupItem value="organization_name" id="organization_name" className="mt-1" />
                <Label htmlFor="organization_name" className="font-normal cursor-pointer">
                  <div>
                    <span className="font-semibold">Nombre de Organización</span>
                    <p className="text-sm text-muted-foreground">
                      Fácil de compartir y recordar
                    </p>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">
                      {window.location.origin}/join/{slugify(invitation.organization_name)}
                    </code>
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <RadioGroupItem value="custom" id="custom" className="mt-1" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">
                  <div>
                    <span className="font-semibold">Personalizado</span>
                    <p className="text-sm text-muted-foreground">
                      Define tu propio slug único
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Input para Custom Slug */}
        {slugType === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="custom-slug">Slug Personalizado</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex">
                  <div className="bg-muted px-3 py-2 rounded-l-md border border-r-0 text-sm text-muted-foreground">
                    {window.location.origin}/join/
                  </div>
                  <Input
                    id="custom-slug"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(slugify(e.target.value))}
                    placeholder="mi-equipo-genial"
                    className="rounded-l-none"
                  />
                </div>
                {validationError && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    {validationError}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Solo letras minúsculas, números y guiones (3-50 caracteres)
            </p>
          </div>
        )}

        {/* Preview del Link Final */}
        <div className="space-y-2">
          <Label>Preview del Link</Label>
          <div className="flex gap-2">
            <Input
              value={getInvitationLink()}
              readOnly
              className="bg-muted"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="icon"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={handleUpdateSlug}
            disabled={isSaving || (slugType === 'custom' && (!customSlug || !!validationError))}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        {/* Info */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="font-semibold text-sm mb-1">
            💡 ¿Cuál usar?
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li><strong>Aleatorio:</strong> Máxima seguridad, único garantizado</li>
            <li><strong>Org name:</strong> Fácil de compartir verbalmente</li>
            <li><strong>Custom:</strong> Branding personalizado (ej: /join/nuestro-equipo)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}