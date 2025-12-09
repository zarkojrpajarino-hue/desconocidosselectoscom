import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveCard } from './ResponsiveCard';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface Column<T> {
  id: string;
  header: string;
  cell?: (row: T) => ReactNode;
  accessor?: keyof T;
  className?: string;
  /** Mostrar como título principal en móvil (primera columna destacada) */
  primary?: boolean;
}

interface Action<T> {
  label: string;
  onClick: (row: T) => void;
  icon?: React.ElementType;
  variant?: 'default' | 'destructive';
}

interface MobileDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  keyField?: keyof T;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  renderDesktopTable?: (data: T[], columns: Column<T>[]) => ReactNode;
}

/**
 * Tabla que se convierte en cards en móvil
 * Soporta acciones, clicks en filas y renderizado custom de desktop
 */
export function MobileDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions,
  keyField = 'id' as keyof T,
  emptyMessage = 'No hay datos',
  onRowClick,
  renderDesktopTable,
}: MobileDataTableProps<T>) {
  const isMobile = useIsMobile();

  // Renderizar tabla desktop si existe
  if (!isMobile && renderDesktopTable) {
    return <>{renderDesktopTable(data, columns)}</>;
  }

  // Versión móvil: cards
  if (isMobile) {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          {emptyMessage}
        </div>
      );
    }

    // Separar columna primaria del resto
    const primaryCol = columns.find(c => c.primary);
    const otherCols = columns.filter(c => !c.primary);

    return (
      <div className="space-y-3">
        {data.map((row, index) => {
          const key = row[keyField] as string ?? index;
          
          return (
            <ResponsiveCard
              key={key}
              hoverable={!!onRowClick}
              onClick={() => onRowClick?.(row)}
              className="relative"
            >
              {/* Actions menu en móvil */}
              {actions && actions.length > 0 && (
                <div className="absolute top-3 right-3 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover z-50">
                      {actions.map((action, actionIndex) => {
                        const Icon = action.icon;
                        return (
                          <DropdownMenuItem
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            className={cn(
                              action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                            )}
                          >
                            {Icon && <Icon className="mr-2 h-4 w-4" />}
                            {action.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Título principal si existe */}
              {primaryCol && (
                <div className="mb-3 pr-8">
                  <span className="font-semibold text-base">
                    {primaryCol.cell
                      ? primaryCol.cell(row)
                      : primaryCol.accessor
                        ? String(row[primaryCol.accessor] ?? '')
                        : ''}
                  </span>
                </div>
              )}

              {/* Datos en formato key-value */}
              <div className={cn('space-y-2', actions && 'pr-8')}>
                {otherCols.map((col) => {
                  const value = col.cell
                    ? col.cell(row)
                    : col.accessor
                      ? String(row[col.accessor] ?? '')
                      : '';

                  return (
                    <div key={col.id} className="flex justify-between items-start gap-4">
                      <span className="text-xs text-muted-foreground font-medium min-w-[80px]">
                        {col.header}
                      </span>
                      <div className={cn(
                        'text-sm text-right flex-1',
                        col.className
                      )}>
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ResponsiveCard>
          );
        })}
      </div>
    );
  }

  // Fallback: tabla simple en desktop sin renderDesktopTable
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className="px-4 py-3 text-left text-sm font-medium"
              >
                {col.header}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-4 py-3 text-right text-sm font-medium w-[80px]">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions?.length ? 1 : 0)}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const key = row[keyField] as string ?? index;
              
              return (
                <tr
                  key={key}
                  className={cn(
                    'border-t',
                    onRowClick && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-3 text-sm">
                      {col.cell
                        ? col.cell(row)
                        : col.accessor
                          ? String(row[col.accessor] ?? '')
                          : ''}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover z-50">
                          {actions.map((action, actionIndex) => {
                            const Icon = action.icon;
                            return (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(row);
                                }}
                                className={cn(
                                  action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                                )}
                              >
                                {Icon && <Icon className="mr-2 h-4 w-4" />}
                                {action.label}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

interface MobileListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
  className?: string;
  keyExtractor?: (item: T, index: number) => string;
}

/**
 * Lista simple para móvil (sin conversión de tabla)
 */
export function MobileList<T>({
  items,
  renderItem,
  emptyMessage = 'No hay elementos',
  className,
  keyExtractor,
}: MobileListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, index) => (
        <div key={keyExtractor?.(item, index) ?? index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
