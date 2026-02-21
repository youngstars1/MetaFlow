import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("MetaFlow Critical Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-primary)',
                    color: '#fff',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <h1 style={{ color: 'var(--accent-primary)', fontFamily: 'Space Grotesk' }}>Error de Sistema</h1>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '1rem 0' }}>
                        MetaFlow ha detectado una inconsistencia crítica y ha detenido los procesos para proteger tus datos.
                    </p>
                    <button
                        className="btn-wealth"
                        onClick={() => window.location.reload()}
                    >
                        Reiniciar Aplicación
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
