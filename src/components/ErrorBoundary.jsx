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
        console.error("[MetaFlow] Critical Error:", error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    handleClearAndReload = () => {
        // Clear potentially corrupted cache but keep auth
        try {
            const keysToKeep = ['sb-', 'metaflow_skipped', 'metaflow_onboarded', 'metaflow_theme'];
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => {
                if (!keysToKeep.some(k => key.startsWith(k))) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) { /* ignore */ }
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0a0b',
                    color: '#fff',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                    <h1 style={{ color: '#00e5c3', fontFamily: 'Space Grotesk', fontSize: 24, marginBottom: 8 }}>Error de Sistema</h1>
                    <p style={{ color: '#a1a1aa', maxWidth: 400, margin: '0 0 8px', fontSize: 14 }}>
                        MetaFlow detectó un error. Tus datos están seguros.
                    </p>
                    <p style={{ color: '#52525b', maxWidth: 400, margin: '0 0 24px', fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {this.state.error?.message || 'Error desconocido'}
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={this.handleReload}
                            style={{
                                padding: '10px 24px', borderRadius: 10, border: 'none',
                                background: '#00e5c3', color: '#000', fontWeight: 700,
                                fontSize: 13, cursor: 'pointer',
                            }}
                        >
                            Reiniciar
                        </button>
                        <button
                            onClick={this.handleClearAndReload}
                            style={{
                                padding: '10px 24px', borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent', color: '#a1a1aa',
                                fontSize: 13, cursor: 'pointer',
                            }}
                        >
                            Limpiar caché
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
