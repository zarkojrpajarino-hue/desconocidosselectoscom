import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, ExternalLink } from 'lucide-react';

interface HTMLDocumentViewerProps {
  htmlPath: string;
  title: string;
}

const HTMLDocumentViewer = ({ htmlPath, title }: HTMLDocumentViewerProps) => {
  const [zoom, setZoom] = useState(0.8);
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    // Detectar tamaño de pantalla y ajustar zoom inicial
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setZoom(0.4); // Móvil
      } else if (width < 1024) {
        setZoom(0.6); // Tablet
      } else {
        setZoom(0.8); // Desktop
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Cargar contenido HTML
    fetch(htmlPath)
      .then(response => response.text())
      .then(data => setHtmlContent(data))
      .catch(error => console.error('Error loading HTML:', error));
  }, [htmlPath]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.3));
  };

  const handleReset = () => {
    const width = window.innerWidth;
    if (width < 768) {
      setZoom(0.4);
    } else if (width < 1024) {
      setZoom(0.6);
    } else {
      setZoom(0.8);
    }
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleFullscreen = () => {
    const element = document.getElementById('html-viewer-container');
    if (element) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-250px)] min-h-[600px] bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden" id="html-viewer-container">
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg p-2 shadow-lg border">
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleZoomOut}
          title="Reducir zoom"
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <div className="px-3 py-1 text-sm font-semibold bg-primary/10 rounded flex items-center min-w-[60px] justify-center">
          {Math.round(zoom * 100)}%
        </div>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleZoomIn}
          title="Aumentar zoom"
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleReset}
          title="Restablecer zoom"
          className="h-8 px-3"
        >
          Reset
        </Button>

        <div className="w-px bg-border" />
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleFullscreen}
          title="Pantalla completa"
          className="h-8 w-8 p-0"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleOpenInNewTab}
          title="Abrir en nueva pestaña"
          className="h-8 w-8 p-0"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {/* Contenedor del HTML con zoom */}
      <div 
        className="w-full h-full overflow-auto bg-white dark:bg-gray-900"
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          width: `${100 / zoom}%`,
          height: `${100 / zoom}%`
        }}
      >
        {htmlContent ? (
          <iframe
            srcDoc={htmlContent}
            className="w-full h-full border-0"
            title={title}
            sandbox="allow-same-origin allow-scripts"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando documento...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HTMLDocumentViewer;
