import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showNav?: boolean;
  showHeader?: boolean;
  headerActions?: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Layout wrapper que adapta contenido para móvil automáticamente
 * En desktop, renderiza children directamente sin wrapper
 */
export function MobileLayout({
  children,
  title,
  subtitle,
  showNav = true,
  showHeader = true,
  headerActions,
  className,
  contentClassName,
}: MobileLayoutProps) {
  const isMobile = useIsMobile();

  // Si no es móvil, renderizar contenido sin wrapper
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className={cn('min-h-screen bg-background', showNav && 'pb-20', className)}>
      {showHeader && title && (
        <MobileHeader title={title} subtitle={subtitle} actions={headerActions} />
      )}
      
      <main className={cn('px-4 py-4', contentClassName)}>
        {children}
      </main>
      
      {showNav && <BottomNav />}
    </div>
  );
}

interface MobileSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

/**
 * Sección con título para contenido móvil
 */
export function MobileSection({
  title,
  children,
  className,
  action,
}: MobileSectionProps) {
  return (
    <section className={cn('space-y-3 mb-6', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && (
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

type GridColsValue = 1 | 2 | 3 | 4;

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: { mobile?: GridColsValue; tablet?: GridColsValue; desktop?: GridColsValue };
  gap?: 2 | 3 | 4 | 6;
  className?: string;
}

// Mapeo estático de columnas para que Tailwind las incluya
const colsMap: Record<GridColsValue, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

const mdColsMap: Record<GridColsValue, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

const lgColsMap: Record<GridColsValue, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

const gapMap: Record<2 | 3 | 4 | 6, string> = {
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
};

/**
 * Grid responsive con clases estáticas para Tailwind JIT
 */
export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className,
}: ResponsiveGridProps) {
  const mobileCol = cols.mobile || 1;
  const tabletCol = cols.tablet || 2;
  const desktopCol = cols.desktop || 3;

  return (
    <div
      className={cn(
        'grid',
        colsMap[mobileCol],
        mdColsMap[tabletCol],
        lgColsMap[desktopCol],
        gapMap[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Scroll horizontal con snap para móvil (stats, cards, etc.)
 */
export function HorizontalScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Item para scroll horizontal
 */
export function HorizontalScrollItem({
  children,
  minWidth = 160,
  className,
}: {
  children: ReactNode;
  minWidth?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('snap-center flex-shrink-0', className)}
      style={{ minWidth }}
    >
      {children}
    </div>
  );
}
