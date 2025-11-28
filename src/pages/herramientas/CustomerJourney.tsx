import HTMLDocumentViewer from '@/components/HTMLDocumentViewer';

const CustomerJourney = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customer Journey</h2>
      <p className="text-muted-foreground">
        Mapa del recorrido del cliente desde el primer contacto hasta la conversión y fidelización.
      </p>
      <HTMLDocumentViewer 
        htmlPath="/html/customer-journey.html"
        title="Customer Journey - Experiencia Selecta"
      />
    </div>
  );
};

export default CustomerJourney;
