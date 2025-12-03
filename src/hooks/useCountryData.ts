import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CountryData {
  id: string;
  country_code: string;
  country_name: string;
  currency: string;
  vat_rate: number | null;
  corporate_tax_rate: number | null;
  population: number | null;
  median_age: number | null;
  internet_penetration: number | null;
  ecommerce_penetration: number | null;
  gdp_per_capita: number | null;
  unemployment_rate: number | null;
  top_social_platforms: string[];
  top_ecommerce_platforms: string[];
  data_privacy_law: string | null;
}

export interface CompetitorData {
  id: string;
  country_code: string;
  industry: string;
  competitor_name: string;
  competitor_website: string | null;
  market_position: string | null;
  estimated_market_share: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
}

export const useCountryData = () => {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('country_data')
        .select('*')
        .order('country_name');

      if (error) throw error;
      
      const mapped = (data || []).map(c => ({
        ...c,
        top_social_platforms: Array.isArray(c.top_social_platforms) 
          ? c.top_social_platforms 
          : [],
        top_ecommerce_platforms: Array.isArray(c.top_ecommerce_platforms) 
          ? c.top_ecommerce_platforms 
          : [],
      })) as CountryData[];
      
      setCountries(mapped);
    } catch (error) {
      console.error('Error loading countries:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de países',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCountryByCode = useCallback((countryCode: string): CountryData | null => {
    return countries.find(c => c.country_code === countryCode) || null;
  }, [countries]);

  const getCompetitors = async (
    countryCode: string,
    industry: string
  ): Promise<CompetitorData[]> => {
    try {
      const { data, error } = await supabase
        .from('competitive_landscape')
        .select('*')
        .eq('country_code', countryCode)
        .eq('industry', industry)
        .order('estimated_market_share', { ascending: false });

      if (error) throw error;
      return (data || []) as CompetitorData[];
    } catch (error) {
      console.error('Error loading competitors:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los competidores',
        variant: 'destructive',
      });
      return [];
    }
  };

  return {
    countries,
    loading,
    getCountryByCode,
    getCompetitors,
    refetch: loadCountries,
  };
};

// Hook específico para cálculos de impuestos
export const useTaxCalculator = () => {
  const calculateTaxes = async (
    revenue: number,
    organizationId: string
  ) => {
    try {
      // Obtener país de la organización
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('country_code')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;

      if (!org?.country_code) {
        return {
          gross_revenue: revenue,
          vat: 0,
          vat_rate: 0,
          net_revenue: revenue,
          corporate_tax: 0,
          corporate_tax_rate: 0,
          net_income: revenue,
        };
      }

      // Obtener tasas impositivas
      const { data: countryData, error: countryError } = await supabase
        .from('country_data')
        .select('vat_rate, corporate_tax_rate')
        .eq('country_code', org.country_code)
        .single();

      if (countryError) throw countryError;

      const vatRate = countryData?.vat_rate || 0;
      const corpTaxRate = countryData?.corporate_tax_rate || 0;

      const vat = revenue * (vatRate / 100);
      const netRevenue = revenue - vat;
      const corporateTax = netRevenue * (corpTaxRate / 100);
      const netIncome = netRevenue - corporateTax;

      return {
        gross_revenue: revenue,
        vat,
        vat_rate: vatRate,
        net_revenue: netRevenue,
        corporate_tax: corporateTax,
        corporate_tax_rate: corpTaxRate,
        net_income: netIncome,
      };
    } catch (error) {
      console.error('Error calculating taxes:', error);
      throw error;
    }
  };

  return { calculateTaxes };
};
