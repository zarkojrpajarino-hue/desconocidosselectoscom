import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChangelog } from '@/hooks/useChangelog';
import { Megaphone, Sparkles, Bug, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Public Changelog Page
 */
export function ChangelogPage() {
  const { entries, markAsViewed, isUnread } = useChangelog();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="h-4 w-4" />;
      case 'improvement':
        return <CheckCircle className="h-4 w-4" />;
      case 'bugfix':
        return <Bug className="h-4 w-4" />;
      case 'breaking':
        return <AlertTriangle className="h-4 w-4" />;
      case 'security':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Megaphone className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-primary/10 text-primary';
      case 'improvement':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'bugfix':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'breaking':
        return 'bg-destructive/10 text-destructive';
      case 'security':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feature':
        return 'Nueva funcionalidad';
      case 'improvement':
        return 'Mejora';
      case 'bugfix':
        return 'Bug fix';
      case 'breaking':
        return 'Breaking change';
      case 'security':
        return 'Seguridad';
      default:
        return type;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Changelog</h1>
        <p className="text-muted-foreground">
          Mantente al día con las últimas actualizaciones de OPTIMUS-K
        </p>
      </div>

      {/* Entries */}
      <div className="space-y-8">
        {entries.map((entry) => {
          const publishedDate = entry.published_at 
            ? new Date(entry.published_at)
            : new Date(entry.created_at);
          const unread = isUnread(entry.id);

          return (
            <Card 
              key={entry.id} 
              className={`p-6 ${unread ? 'ring-2 ring-primary/20' : ''}`}
              onClick={() => unread && markAsViewed(entry.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getTypeColor(entry.category)}>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(entry.category)}
                        {getTypeLabel(entry.category)}
                      </span>
                    </Badge>
                    <Badge variant="outline">v{entry.version}</Badge>
                    {unread && (
                      <Badge variant="secondary" className="text-xs">
                        Nuevo
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold">{entry.title}</h2>
                </div>
                <time className="text-sm text-muted-foreground whitespace-nowrap">
                  {publishedDate.toLocaleDateString('es', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-4">{entry.description}</p>

              {/* Details */}
              {entry.details && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{entry.details}</p>
                </div>
              )}
            </Card>
          );
        })}

        {entries.length === 0 && (
          <Card className="p-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No hay actualizaciones todavía</h3>
            <p className="text-sm text-muted-foreground">
              Pronto publicaremos las novedades de OPTIMUS-K
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
