import { Component } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    const { t } = this.props;
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-6 rounded shadow-md text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              {t?.error || 'Something went wrong.'}
            </h2>
            <p className="mb-4">{t?.error_message || 'Please try refreshing the page.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {t?.refresh || 'Refresh'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrapper to use hooks in class component
const ErrorBoundaryWithLanguage = (props) => {
  const { t } = useLanguage();
  return <ErrorBoundary t={t} {...props} />;
};

export default ErrorBoundaryWithLanguage;
