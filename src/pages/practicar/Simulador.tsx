import HTMLDocumentViewer from '@/components/HTMLDocumentViewer';

const Simulador = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Simulador de Ventas</h2>
      <p className="text-muted-foreground">
        Practica tus habilidades de venta con escenarios realistas y obtén feedback inmediato.
      </p>
      <HTMLDocumentViewer 
        htmlPath="/html/simulador.html"
        title="Simulador de Ventas"
      />
    </div>
  );
};

export default Simulador;
