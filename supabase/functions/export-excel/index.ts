import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exportType, data, metadata } = await req.json();

    console.log(`Generating Excel for type: ${exportType}`);

    // Generar contenido Excel (XLSX)
    const xlsxContent = generateExcelContent(exportType, data, metadata);

    return new Response(
      JSON.stringify({ 
        success: true, 
        base64: xlsxContent,
        filename: `${metadata?.organizationName || 'export'}_${exportType}_${new Date().toISOString().split('T')[0]}.xlsx`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating Excel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateExcelContent(exportType: string, data: any, metadata: any): string {
  // Generar XML para Excel (formato XLSX simplificado)
  const rows = convertDataToRows(exportType, data);
  
  const sheetData = rows.map((row, rowIndex) => {
    const cells = row.map((cell, colIndex) => {
      const colLetter = String.fromCharCode(65 + colIndex);
      const cellRef = `${colLetter}${rowIndex + 1}`;
      const isHeader = rowIndex === 0;
      const cellValue = String(cell ?? '');
      
      // Determinar si es número
      const isNumber = !isNaN(Number(cellValue)) && cellValue !== '';
      
      if (isNumber) {
        return `<c r="${cellRef}"><v>${cellValue}</v></c>`;
      } else {
        return `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(cellValue)}</t></is></c>`;
      }
    }).join('');
    
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');

  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetData}
  </sheetData>
</worksheet>`;

  // Crear estructura XLSX mínima
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${metadata?.title || exportType}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  // Crear un archivo simple en lugar de ZIP complejo
  // En producción, usarías una librería como xlsx o exceljs
  const simpleXML = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>${metadata?.title || exportType}</Title>
    <Author>${metadata?.organizationName || 'Export'}</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Worksheet ss:Name="${metadata?.title || 'Datos'}">
    <Table>
      ${rows.map((row, rowIndex) => `
        <Row>
          ${row.map(cell => `
            <Cell${rowIndex === 0 ? ' ss:StyleID="Header"' : ''}>
              <Data ss:Type="${typeof cell === 'number' ? 'Number' : 'String'}">${escapeXml(String(cell ?? ''))}</Data>
            </Cell>
          `).join('')}
        </Row>
      `).join('')}
    </Table>
  </Worksheet>
</Workbook>`;

  return btoa(simpleXML);
}

function convertDataToRows(exportType: string, data: any): any[][] {
  if (!data) return [['No hay datos']];
  
  const dataArray = Array.isArray(data) ? data : [data];
  
  switch (exportType) {
    case 'metrics':
      return [
        ['Fecha', 'Ingresos', 'Leads', 'Tasa Conversión', 'CAC', 'LTV', 'NPS', 'Notas'],
        ...dataArray.map(m => [
          m.metric_date || '',
          m.revenue || 0,
          m.leads_generated || 0,
          m.conversion_rate || 0,
          m.cac || 0,
          m.lifetime_value || 0,
          m.nps_score || '',
          m.notes || ''
        ])
      ];
      
    case 'leads':
      return [
        ['Nombre', 'Empresa', 'Email', 'Teléfono', 'Valor', 'Score', 'Tipo', 'Etapa', 'Fuente', 'Probabilidad', 'Creado'],
        ...dataArray.map(l => [
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
        ])
      ];
      
    case 'okrs':
      return [
        ['Objetivo', 'Descripción', 'Quarter', 'Año', 'Status', 'Owner', 'Fecha Objetivo', 'Impacto'],
        ...dataArray.map(o => [
          o.title || '',
          o.description || '',
          o.quarter || '',
          o.year || '',
          o.status || '',
          o.owner_name || '',
          o.target_date || '',
          o.revenue_impact || 0
        ])
      ];
      
    case 'financial':
      return [
        ['Fecha', 'Tipo', 'Categoría', 'Monto', 'Descripción', 'Método Pago', 'Recurrente', 'Notas'],
        ...dataArray.map(t => [
          t.date || '',
          t.type || (t.amount > 0 ? 'Ingreso' : 'Gasto'),
          t.category || t.product_category || '',
          Math.abs(t.amount || 0),
          t.description || t.product_name || '',
          t.payment_method || '',
          t.is_recurring ? 'Sí' : 'No',
          t.notes || ''
        ])
      ];
      
    case 'competitive-analysis':
      if (data.competitors) {
        return [
          ['Nombre', 'Website', 'Descripción', 'Posición', 'Fortalezas', 'Debilidades'],
          ...data.competitors.map((c: any) => [
            c.name || '',
            c.website || '',
            c.description || '',
            c.market_position || '',
            c.strengths?.join(', ') || '',
            c.weaknesses?.join(', ') || ''
          ])
        ];
      }
      return [['Competidor', 'Info'], ['Sin datos', '']];
      
    default:
      // Genérico
      if (dataArray.length === 0) return [['No hay datos']];
      const headers = Object.keys(dataArray[0]);
      return [
        headers,
        ...dataArray.map(item => headers.map(h => item[h] ?? ''))
      ];
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
