import HTMLDocumentViewer from '@/components/HTMLDocumentViewer';

const BuyerPersona = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Buyer Persona</h2>
      <p className="text-muted-foreground">
        Perfil detallado del cliente ideal para enfocar estrategias de marketing y ventas.
      </p>
      <HTMLDocumentViewer 
        htmlPath="/html/buyer-persona.html"
        title="Buyer Persona - Experiencia Selecta"
      />
    </div>
  );
};

export default BuyerPersona;
