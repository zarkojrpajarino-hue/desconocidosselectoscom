/**
 * COMPONENTE UNIVERSAL DE EXPORTACIÓN
 * 
 * Botón reutilizable para exportar cualquier tipo de dato
 * en múltiples formatos: PDF, Excel, CSV, JSON
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

// ============================================
// TIPOS
// ============================================

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export type ExportType = 
  | 'metrics'
  | 'ai-analysis'
  | 'tool-content'
  | 'okrs'
  | 'leads'
  | 'financial'
  | 'competitive-analysis';

interface ExportButtonProps {
  exportType: ExportType;
  data: any;
  metadata?: {
    title?: string;
    subtitle?: string;
    organizationName?: string;
    userName?: string;
    dateRange?: string;
  };
  availableFormats?: ExportFormat[];
  onExportComplete?: (format: ExportFormat) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  buttonText?: string;
  iconOnly?: boolean;
}

// ============================================
// FORMATOS PERMITIDOS POR PLAN
// ============================================

const PLAN_EXPORT_FORMATS: Record<string, ExportFormat[]> = {
  free: ['csv'],
  trial: ['csv'],
  starter: ['csv', 'excel'],
  professional: ['csv', 'excel', 'pdf', 'json'],
  enterprise: ['csv', 'excel', 'pdf', 'json'],
};

// ============================================
// COMPONENTE
// ============================================

export function ExportButton({
  exportType,
  data,
  metadata = {},
  availableFormats = ['pdf', 'excel', 'csv'],
  onExportComplete,
  variant = 'outline',
  size = 'default',
  className = '',
  buttonText = 'Exportar',
  iconOnly = false
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const { plan } = useSubscriptionLimits();

  // Filtrar formatos disponibles según el plan
  const allowedFormats = PLAN_EXPORT_FORMATS[plan] || ['csv'];
  const filteredFormats = availableFormats.filter(f => allowedFormats.includes(f));

  // ============================================
  // HANDLERS DE EXPORTACIÓN
  // ============================================

  const handleExport = async (format: ExportFormat) => {
    // Verificar si el formato está permitido
    if (!allowedFormats.includes(format)) {
      toast.error(`El formato ${format.toUpperCase()} no está disponible en tu plan. Actualiza para desbloquear.`);
      return;
    }

    try {
      setIsExporting(true);
      setExportingFormat(format);

      toast.loading(`Generando ${format.toUpperCase()}...`, {
        id: 'export-loading'
      });

      let result;
      
      switch (format) {
        case 'pdf':
          result = await exportToPDF();
          break;
        case 'excel':
          result = await exportToExcel();
          break;
        case 'csv':
          result = await exportToCSV();
          break;
        case 'json':
          result = await exportToJSON();
          break;
        default:
          throw new Error(`Formato no soportado: ${format}`);
      }

      downloadFile(result.blob, result.filename);

      toast.success(`Archivo descargado: ${result.filename}`, {
        id: 'export-loading'
      });

      onExportComplete?.(format);

    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar. Inténtalo de nuevo.', {
        id: 'export-loading'
      });
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  // ============================================
  // EXPORTAR A PDF (via Edge Function)
  // ============================================

  const exportToPDF = async () => {
    const { data: responseData, error } = await supabase.functions.invoke('export-pdf', {
      body: {
        exportType,
        data,
        metadata
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate PDF');
    }

    // La edge function devuelve base64
    const base64 = responseData.base64;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const filename = generateFilename('pdf');

    return { blob, filename };
  };

  // ============================================
  // EXPORTAR A EXCEL (via Edge Function)
  // ============================================

  const exportToExcel = async () => {
    const { data: responseData, error } = await supabase.functions.invoke('export-excel', {
      body: {
        exportType,
        data,
        metadata
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate Excel');
    }

    // La edge function devuelve base64
    const base64 = responseData.base64;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = generateFilename('xlsx');

    return { blob, filename };
  };

  // ============================================
  // EXPORTAR A CSV (Cliente - más rápido)
  // ============================================

  const exportToCSV = async () => {
    const csv = convertToCSV(data, exportType);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const filename = generateFilename('csv');

    return { blob, filename };
  };

  // ============================================
  // EXPORTAR A JSON
  // ============================================

  const exportToJSON = async () => {
    const json = JSON.stringify({ metadata, data, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = generateFilename('json');

    return { blob, filename };
  };

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

  const generateFilename = (extension: string): string => {
    const date = new Date().toISOString().split('T')[0];
    const type = exportType.replace('-', '_');
    const orgName = metadata.organizationName?.replace(/\s+/g, '_').substring(0, 20) || 'export';
    
    return `${orgName}_${type}_${date}.${extension}`;
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // ============================================
  // CONVERTIR A CSV (CLIENTE)
  // ============================================

  const convertToCSV = (data: any, type: ExportType): string => {
    if (!data) return '';
    
    switch (type) {
      case 'metrics':
        return convertMetricsToCSV(Array.isArray(data) ? data : [data]);
      case 'leads':
        return convertLeadsToCSV(Array.isArray(data) ? data : [data]);
      case 'okrs':
        return convertOKRsToCSV(Array.isArray(data) ? data : [data]);
      case 'financial':
        return convertFinancialToCSV(Array.isArray(data) ? data : [data]);
      default:
        return convertGenericToCSV(Array.isArray(data) ? data : [data]);
    }
  };

  const convertMetricsToCSV = (metrics: any[]): string => {
    const headers = ['Fecha', 'Ingresos', 'Leads', 'Tasa Conversión', 'CAC', 'LTV', 'NPS', 'Notas'];
    const rows = metrics.map(m => [
      m.metric_date || m.date || '',
      m.revenue || 0,
      m.leads_generated || 0,
      m.conversion_rate || 0,
      m.cac || 0,
      m.lifetime_value || 0,
      m.nps_score || '',
      m.notes || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  };

  const convertLeadsToCSV = (leads: any[]): string => {
    const headers = [
      'Nombre', 'Empresa', 'Email', 'Teléfono', 'Valor Estimado', 
      'Score', 'Tipo', 'Etapa', 'Fuente', 'Probabilidad', 'Fecha Creación'
    ];
    
    const rows = leads.map(l => [
      l.name || '',
      l.company || '',
      l.email || '',
      l.phone || '',
      l.estimated_value || 0,
      l.lead_score || '',
      l.lead_type || '',
      l.stage || '',
      l.source || '',
      l.probability || 0,
      l.created_at || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  };

  const convertOKRsToCSV = (okrs: any[]): string => {
    const headers = [
      'Objetivo', 'Descripción', 'Quarter', 'Año', 'Status',
      'Owner', 'Fecha Objetivo', 'Impacto Financiero'
    ];
    
    const rows = okrs.map(o => [
      o.title || '',
      o.description || '',
      o.quarter || '',
      o.year || '',
      o.status || '',
      o.owner_name || '',
      o.target_date || '',
      o.revenue_impact || 0
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  };

  const convertFinancialToCSV = (transactions: any[]): string => {
    const headers = [
      'Fecha', 'Tipo', 'Categoría', 'Monto', 'Descripción', 
      'Método Pago', 'Recurrente', 'Notas'
    ];
    
    const rows = transactions.map(t => [
      t.date || '',
      t.type || (t.amount > 0 ? 'Ingreso' : 'Gasto'),
      t.category || t.product_category || '',
      Math.abs(t.amount || 0),
      t.description || t.product_name || '',
      t.payment_method || '',
      t.is_recurring ? 'Sí' : 'No',
      t.notes || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  };

  const convertGenericToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => item[header] ?? '')
    );

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  };

  // ============================================
  // ICONOS Y LABELS
  // ============================================

  const getFormatIcon = (format: ExportFormat, isLocked: boolean) => {
    if (isLocked) {
      return <Lock className="w-4 h-4 mr-2 text-muted-foreground" />;
    }
    switch (format) {
      case 'pdf':
        return <FileText className="w-4 h-4 mr-2 text-red-500" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />;
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-500" />;
      case 'json':
        return <FileJson className="w-4 h-4 mr-2 text-yellow-600" />;
    }
  };

  const getFormatLabel = (format: ExportFormat, isLocked: boolean) => {
    const baseLabel = {
      pdf: 'Exportar como PDF',
      excel: 'Exportar como Excel',
      csv: 'Exportar como CSV',
      json: 'Exportar como JSON',
    }[format];
    
    return isLocked ? `${baseLabel} (Pro)` : baseLabel;
  };

  // ============================================
  // RENDER
  // ============================================

  if (filteredFormats.length === 0) {
    return null; // No hay formatos disponibles
  }

  // Si solo hay un formato, botón directo
  if (filteredFormats.length === 1) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={isExporting}
        onClick={() => handleExport(filteredFormats[0])}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            {!iconOnly && `${buttonText} CSV`}
          </>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              {!iconOnly && buttonText}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableFormats.map((format) => {
          const isLocked = !allowedFormats.includes(format);
          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting || isLocked}
              className={isLocked ? 'opacity-50' : ''}
            >
              {getFormatIcon(format, isLocked)}
              {getFormatLabel(format, isLocked)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportButton;
