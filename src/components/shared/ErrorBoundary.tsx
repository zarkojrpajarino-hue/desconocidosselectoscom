import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from "@sentry/react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Send to Sentry in production
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
    
    // Log in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/home';
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
          <Card className="max-w-lg w-full shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Algo salió mal</CardTitle>
              <CardDescription>
                Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-auto max-h-32">
                  <p className="text-destructive font-semibold">{this.state.error.message}</p>
                  {this.state.errorInfo && (
                    <pre className="text-muted-foreground mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={this.handleReload} className="flex-1 gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Recargar página
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1 gap-2">
                  <Home className="w-4 h-4" />
                  Ir al inicio
                </Button>
              </div>
              
              <Button 
                onClick={this.handleReset} 
                variant="ghost" 
                className="w-full text-muted-foreground"
              >
                Intentar de nuevo sin recargar
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
