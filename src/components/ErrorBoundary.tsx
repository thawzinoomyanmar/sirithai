import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetKey: number;
}

export class ErrorBoundary extends Component<Props, State> {
  declare public props: Props;
  declare public setState: (state: Partial<State> | ((previousState: State) => Partial<State>)) => void;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    resetKey: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React Error Boundary Exception:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleTryAgain = () => {
    this.setState((previousState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      resetKey: previousState.resetKey + 1
    }));
  };

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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans select-none">
          <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg text-center space-y-4">
            <div className="w-16 h-16 bg-purple-50 text-brand-purple rounded-2xl flex items-center justify-center mx-auto text-3xl font-black border border-purple-100">
              ⚡
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Application Runtime Notice
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
              A temporary rendering notice was captured. You can click <strong>Try Again</strong> to resume your session immediately.
            </p>

            {this.state.error && (
              <div className="bg-slate-50 p-3.5 rounded-xl text-left font-mono text-[11px] text-purple-700 overflow-x-auto max-h-32 border border-slate-200/80">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleTryAgain}
                className="flex-1 py-3 px-4 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl font-sans font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                ✨ Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                🔄 Reload Page
              </button>
            </div>
            
            <button
              onClick={this.handleResetStorage}
              className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-wider pt-1 transition-colors cursor-pointer block mx-auto"
            >
              🧹 Clear Storage Cache
            </button>
          </div>
        </div>
      );
    }

    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}
