import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  width?: number;
  height?: number;
}

/**
 * LazyImage - Componente de imagen con lazy loading
 * 
 * @description
 * Carga imágenes solo cuando están visibles en el viewport usando
 * IntersectionObserver para mejor performance.
 * 
 * @example
 * ```tsx
 * <LazyImage 
 *   src="/avatar.jpg" 
 *   alt="User avatar" 
 *   className="w-10 h-10 rounded-full"
 * />
 * ```
 */
export function LazyImage({ 
  src, 
  alt, 
  className, 
  placeholder = '/placeholder.svg',
  width,
  height 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (!imgRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );
    
    observer.observe(imgRef.current);
    
    return () => observer.disconnect();
  }, []);
  
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };
  
  const imageSrc = error ? placeholder : (isInView ? src : placeholder);
  
  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-50',
        className
      )}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
    />
  );
}
