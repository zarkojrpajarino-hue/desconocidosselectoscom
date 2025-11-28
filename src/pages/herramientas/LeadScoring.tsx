import HTMLDocumentViewer from '@/components/HTMLDocumentViewer';

const LeadScoring = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Lead Scoring</h2>
      <p className="text-muted-foreground">
        Sistema de puntuación para calificar y priorizar leads según su potencial de conversión.
      </p>
      <HTMLDocumentViewer 
        htmlPath="/html/lead-scoring.html"
        title="Lead Scoring - Experiencia Selecta"
      />
    </div>
  );
};

export default LeadScoring;
