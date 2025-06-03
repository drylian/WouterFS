export default `
import React, { Component, ErrorInfo, ReactNode } from 'react';

const styles = {
    errorContainer: {
        padding: '20px',
        backgroundColor: '#ffe6e6',
        border: '1px solid #ff9999',
        borderRadius: '4px',
        color: '#cc0000',
        maxWidth: '800px',
        margin: '20px auto',
    },
    title: {
        marginTop: 0,
    },
    details: {
        margin: '15px 0',
    },
    errorMessage: {
        whiteSpace: 'pre-wrap',
        overflowX: 'auto',
    },
    stackTrace: {
        fontSize: '12px',
        color: '#666',
        whiteSpace: 'pre-wrap',
        overflowX: 'auto',
    },
    resetButton: {
        padding: '8px 16px',
        backgroundColor: '#cc0000',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
    },
} as const;


interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return this.props.fallback || this.defaultFallback();
        }

        return this.props.children;
    }

    private defaultFallback(): ReactNode {
        return (
            <div style={styles.errorContainer}>
                <h2 style={styles.title}>Something went wrong</h2>
                {this.state.error && (
                    <details style={styles.details}>
                        <summary>Error details</summary>
                        <pre style={styles.errorMessage}>{this.state.error.message}</pre>
                        <pre style={styles.stackTrace}>{this.state.error.stack}</pre>
                    </details>
                )}
                <button
                    style={styles.resetButton}
                    onClick={() => this.setState({ hasError: false })}
                >
                    Try again
                </button>
            </div>
        );
    }
}

export default ErrorBoundary;
`