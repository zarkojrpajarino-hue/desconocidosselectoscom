import HTMLDocumentViewer from '@/components/HTMLDocumentViewer';

const GrowthModel = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Growth Model</h2>
      <p className="text-muted-foreground">
        Modelo de crecimiento para planificar y ejecutar estrategias de expansión del negocio.
      </p>
      <HTMLDocumentViewer 
        htmlPath="/html/growth-model.html"
        title="Growth Model - Experiencia Selecta"
      />
    </div>
  );
};

export default GrowthModel;
