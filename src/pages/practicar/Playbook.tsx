import HTMLDocumentViewer from '@/components/HTMLDocumentViewer';

const Playbook = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Sales Playbook</h2>
      <p className="text-muted-foreground">
        Guía completa de estrategias, técnicas y mejores prácticas de ventas.
      </p>
      <HTMLDocumentViewer 
        htmlPath="/html/playbook.html"
        title="Sales Playbook"
      />
    </div>
  );
};

export default Playbook;
