import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-warm-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-warm-200 shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-danger-light text-danger-main flex items-center justify-center mx-auto mb-5">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-charcoal-900 mb-2">
              Kutilmagan xatolik yuz berdi
            </h1>
            <p className="text-sm text-charcoal-500 mb-6">
              Ilovada tizimli xatolik aniqlandi. Iltimos, sahifani yangilang yoki bosh sahifaga qayting.
            </p>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mb-6 p-3 rounded-xl bg-warm-50 border border-warm-200 text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-danger-main font-semibold">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={this.handleReset}
                className="flex-1"
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Qayta yuklash
              </Button>
              <Button
                variant="primary"
                onClick={this.handleGoHome}
                className="flex-1"
                leftIcon={<Home className="w-4 h-4" />}
              >
                Bosh sahifa
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
