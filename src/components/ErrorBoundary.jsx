import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="max-w-md w-full bg-[#1A1F3A] rounded-2xl border border-red-500/30 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-[#94A3B8] text-sm mb-6">
              {this.state.error?.message || "An unexpected error occurred in the application."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
