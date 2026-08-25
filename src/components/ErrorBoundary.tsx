import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React Error Boundary Exception:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    if (window.confirm("Reset application local storage cache and reload?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white border-2 border-red-100 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-lg text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black">
              ⚠️
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Application Runtime Notice
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
              An unhandled rendering exception occurred. We have isolated the issue to protect your session.
            </p>

            {this.state.error && (
              <div className="bg-slate-100 p-3.5 rounded-xl text-left font-mono text-[11px] text-red-600 overflow-x-auto max-h-36 border border-slate-200">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-brand-purple hover:bg-brand-purple-hover text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
              >
                🔄 Reload Application
              </button>
              <button
                onClick={this.handleResetStorage}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                🧹 Clear Local Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
