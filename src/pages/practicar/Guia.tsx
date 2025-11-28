import HTMLDocumentViewer from '@/components/HTMLDocumentViewer';

const Guia = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Guía de Comunicación</h2>
      <p className="text-muted-foreground">
        Mejora tus habilidades de comunicación con clientes y equipo de trabajo.
      </p>
      <HTMLDocumentViewer 
        htmlPath="/html/guia.html"
        title="Guía de Comunicación - Experiencia Selecta"
      />
    </div>
  );
};

export default Guia;
