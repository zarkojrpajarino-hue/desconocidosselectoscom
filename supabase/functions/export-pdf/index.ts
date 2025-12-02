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

    console.log(`Generating PDF for type: ${exportType}`);

    // Generar HTML para el PDF
    const html = generatePDFHTML(exportType, data, metadata);

    // Usar Puppeteer/jsPDF en el futuro
    // Por ahora, generamos un PDF básico usando una librería ligera

    // Crear PDF básico con texto
    const pdfContent = generateSimplePDF(exportType, data, metadata);

    return new Response(
      JSON.stringify({ 
        success: true, 
        base64: pdfContent,
        filename: `${metadata?.organizationName || 'export'}_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generatePDFHTML(exportType: string, data: any, metadata: any): string {
  const title = metadata?.title || exportType.toUpperCase();
  const orgName = metadata?.organizationName || '';
  const date = new Date().toLocaleDateString('es-ES');

  let contentHTML = '';

  switch (exportType) {
    case 'metrics':
      contentHTML = generateMetricsHTML(data);
      break;
    case 'leads':
      contentHTML = generateLeadsHTML(data);
      break;
    case 'okrs':
      contentHTML = generateOKRsHTML(data);
      break;
    case 'financial':
      contentHTML = generateFinancialHTML(data);
      break;
    case 'ai-analysis':
      contentHTML = generateAIAnalysisHTML(data);
      break;
    case 'competitive-analysis':
      contentHTML = generateCompetitiveHTML(data);
      break;
    default:
      contentHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; }
        h2 { color: #2c5282; margin-top: 30px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .org-name { font-size: 14px; color: #666; }
        .date { font-size: 12px; color: #888; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background-color: #edf2f7; font-weight: bold; }
        tr:nth-child(even) { background-color: #f7fafc; }
        .metric-card { background: #f7fafc; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2b6cb0; }
        .metric-label { font-size: 12px; color: #718096; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${title}</h1>
          <div class="org-name">${orgName}</div>
        </div>
        <div class="date">Generado: ${date}</div>
      </div>
      ${contentHTML}
    </body>
    </html>
  `;
}

function generateMetricsHTML(data: any[]): string {
  if (!data || data.length === 0) return '<p>No hay datos disponibles</p>';
  
  const latestMetrics = data[0];
  
  return `
    <h2>Resumen de Métricas</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
      <div class="metric-card">
        <div class="metric-label">Ingresos</div>
        <div class="metric-value">€${(latestMetrics.revenue || 0).toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Leads Generados</div>
        <div class="metric-value">${latestMetrics.leads_generated || 0}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Tasa de Conversión</div>
        <div class="metric-value">${latestMetrics.conversion_rate || 0}%</div>
      </div>
    </div>
    
    <h2>Histórico</h2>
    <table>
      <tr>
        <th>Fecha</th>
        <th>Ingresos</th>
        <th>Leads</th>
        <th>Conversión</th>
        <th>CAC</th>
      </tr>
      ${data.slice(0, 10).map(m => `
        <tr>
          <td>${m.metric_date || ''}</td>
          <td>€${(m.revenue || 0).toLocaleString()}</td>
          <td>${m.leads_generated || 0}</td>
          <td>${m.conversion_rate || 0}%</td>
          <td>€${m.cac || 0}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

function generateLeadsHTML(data: any[]): string {
  if (!data || data.length === 0) return '<p>No hay leads disponibles</p>';
  
  return `
    <h2>Lista de Leads (${data.length})</h2>
    <table>
      <tr>
        <th>Nombre</th>
        <th>Empresa</th>
        <th>Valor</th>
        <th>Etapa</th>
        <th>Score</th>
      </tr>
      ${data.map(l => `
        <tr>
          <td>${l.name || ''}</td>
          <td>${l.company || ''}</td>
          <td>€${(l.estimated_value || 0).toLocaleString()}</td>
          <td>${l.stage || ''}</td>
          <td>${l.lead_score || ''}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

function generateOKRsHTML(data: any[]): string {
  if (!data || data.length === 0) return '<p>No hay OKRs disponibles</p>';
  
  return `
    <h2>Objetivos y Resultados Clave</h2>
    ${data.map(o => `
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0;">${o.title || 'Sin título'}</h3>
        <p style="color: #666;">${o.description || ''}</p>
        <p><strong>Quarter:</strong> ${o.quarter} ${o.year} | <strong>Status:</strong> ${o.status}</p>
      </div>
    `).join('')}
  `;
}

function generateFinancialHTML(data: any[]): string {
  if (!data || data.length === 0) return '<p>No hay datos financieros</p>';
  
  const totalIngresos = data.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalGastos = data.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  return `
    <h2>Resumen Financiero</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
      <div class="metric-card">
        <div class="metric-label">Total Ingresos</div>
        <div class="metric-value" style="color: #38a169;">€${totalIngresos.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Gastos</div>
        <div class="metric-value" style="color: #e53e3e;">€${totalGastos.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Balance</div>
        <div class="metric-value">€${(totalIngresos - totalGastos).toLocaleString()}</div>
      </div>
    </div>
    
    <h2>Transacciones</h2>
    <table>
      <tr>
        <th>Fecha</th>
        <th>Descripción</th>
        <th>Categoría</th>
        <th>Monto</th>
      </tr>
      ${data.slice(0, 20).map(t => `
        <tr>
          <td>${t.date || ''}</td>
          <td>${t.description || t.product_name || ''}</td>
          <td>${t.category || t.product_category || ''}</td>
          <td style="color: ${t.amount > 0 ? '#38a169' : '#e53e3e'}">
            €${Math.abs(t.amount || 0).toLocaleString()}
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

function generateAIAnalysisHTML(data: any): string {
  if (!data) return '<p>No hay análisis disponible</p>';
  
  return `
    <h2>Análisis con Inteligencia Artificial</h2>
    
    ${data.executive_summary ? `
      <div class="metric-card">
        <h3>Resumen Ejecutivo</h3>
        <p><strong>Salud General:</strong> ${data.executive_summary.overall_health || 'N/A'}</p>
        <p><strong>Insight Principal:</strong> ${data.executive_summary.key_insight || 'N/A'}</p>
        <p><strong>Acción Inmediata:</strong> ${data.executive_summary.immediate_action || 'N/A'}</p>
      </div>
    ` : ''}
    
    ${data.financial_health ? `
      <h3>Salud Financiera</h3>
      <p><strong>Status:</strong> ${data.financial_health.status}</p>
      <p><strong>Score:</strong> ${data.financial_health.score}/100</p>
    ` : ''}
    
    ${data.action_items ? `
      <h3>Acciones Recomendadas</h3>
      <ul>
        ${data.action_items.map((a: any) => `
          <li><strong>[${a.priority}]</strong> ${a.title}: ${a.description}</li>
        `).join('')}
      </ul>
    ` : ''}
  `;
}

function generateCompetitiveHTML(data: any): string {
  if (!data) return '<p>No hay análisis competitivo disponible</p>';
  
  return `
    <h2>Análisis Competitivo</h2>
    
    ${data.competitors ? `
      <h3>Competidores Analizados</h3>
      <table>
        <tr>
          <th>Nombre</th>
          <th>Posición</th>
          <th>Fortalezas</th>
          <th>Debilidades</th>
        </tr>
        ${data.competitors.map((c: any) => `
          <tr>
            <td>${c.name}</td>
            <td>${c.market_position || 'N/A'}</td>
            <td>${c.strengths?.join(', ') || 'N/A'}</td>
            <td>${c.weaknesses?.join(', ') || 'N/A'}</td>
          </tr>
        `).join('')}
      </table>
    ` : ''}
  `;
}

// Función para generar un PDF básico (base64)
// En producción usarías una librería como jsPDF o Puppeteer
function generateSimplePDF(exportType: string, data: any, metadata: any): string {
  // Por ahora generamos un PDF muy básico
  // El contenido real vendría de una librería PDF
  const html = generatePDFHTML(exportType, data, metadata);
  
  // Codificar HTML como base64 como fallback
  // En producción, esto se convertiría a PDF real
  const encoder = new TextEncoder();
  const htmlBytes = encoder.encode(html);
  
  // Crear un PDF mínimo válido con el contenido
  const pdfHeader = '%PDF-1.4\n';
  const pdfContent = `1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${html.length + 50} >>
stream
BT
/F1 12 Tf
50 750 Td
(${metadata?.title || exportType} - ${metadata?.organizationName || 'Export'}) Tj
0 -20 Td
(Generado: ${new Date().toLocaleDateString('es-ES')}) Tj
0 -40 Td
(Ver datos completos en la aplicacion) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${pdfHeader.length + 500}
%%EOF`;

  // Convertir a base64
  const fullPdf = pdfHeader + pdfContent;
  return btoa(fullPdf);
}
