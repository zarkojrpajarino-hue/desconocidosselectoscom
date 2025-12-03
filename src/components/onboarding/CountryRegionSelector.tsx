import { useEffect, useState } from 'react';
import { useCountryData, CountryData } from '@/hooks/useCountryData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, Globe, ShoppingCart } from 'lucide-react';

interface CountryRegionValue {
  country: string;
  region: string;
  markets: string[];
}

interface CountryRegionSelectorProps {
  value: CountryRegionValue;
  onChange: (value: CountryRegionValue) => void;
}

export const CountryRegionSelector = ({
  value,
  onChange,
}: CountryRegionSelectorProps) => {
  const { countries, loading, getCountryByCode } = useCountryData();
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);

  useEffect(() => {
    if (value.country && countries.length > 0) {
      const country = getCountryByCode(value.country);
      setSelectedCountry(country);
    }
  }, [value.country, countries, getCountryByCode]);

  const handleCountryChange = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    setSelectedCountry(country);
    onChange({ ...value, country: countryCode });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de País */}
      <div className="space-y-2">
        <Label htmlFor="country-select" className="text-base font-medium">
          País donde opera tu negocio
        </Label>
        <Select value={value.country} onValueChange={handleCountryChange}>
          <SelectTrigger id="country-select" className="w-full">
            <SelectValue placeholder="Selecciona un país" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.country_code} value={country.country_code}>
                {country.country_name} ({country.currency})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Esto personalizará toda tu experiencia con datos locales
        </p>
      </div>

      {/* Región opcional */}
      {value.country && (
        <div className="space-y-2">
          <Label htmlFor="region-input" className="text-base font-medium">
            Región / Provincia (opcional)
          </Label>
          <Input
            id="region-input"
            placeholder="Ej: Andalucía, Cataluña, Madrid"
            value={value.region}
            onChange={(e) => onChange({ ...value, region: e.target.value })}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Para datos y recomendaciones más específicas
          </p>
        </div>
      )}

      {/* Info automática del país */}
      {selectedCountry && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 space-y-6">
            {/* IVA y Tasas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>IVA en {selectedCountry.country_name}</span>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {selectedCountry.vat_rate ?? 0}%
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Impuesto corporativo</span>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {selectedCountry.corporate_tax_rate ?? 0}%
                </p>
              </div>
            </div>

            {/* Demografía */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Penetración Internet</span>
                </div>
                <p className="text-xl font-semibold">
                  {selectedCountry.internet_penetration ?? 0}%
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  <span>E-commerce</span>
                </div>
                <p className="text-xl font-semibold">
                  {selectedCountry.ecommerce_penetration ?? 0}%
                </p>
              </div>
            </div>

            {/* Plataformas Sociales */}
            {selectedCountry.top_social_platforms.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4 text-primary" />
                  <span>Plataformas sociales populares</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.top_social_platforms.map((platform) => (
                    <Badge
                      key={platform}
                      variant="secondary"
                      className="bg-secondary/50"
                    >
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* E-commerce Platforms */}
            {selectedCountry.top_ecommerce_platforms.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span>Plataformas e-commerce populares</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.top_ecommerce_platforms.map((platform) => (
                    <Badge
                      key={platform}
                      variant="outline"
                      className="border-primary/30"
                    >
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Datos adicionales */}
            <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
              <p>PIB per cápita: {selectedCountry.currency}{(selectedCountry.gdp_per_capita ?? 0).toLocaleString()}</p>
              <p>Edad mediana: {selectedCountry.median_age ?? '-'} años</p>
              <p>Marco legal: {selectedCountry.data_privacy_law ?? '-'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CountryRegionSelector;
