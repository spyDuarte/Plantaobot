import { StrictMode, Component } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 32,
            fontFamily: "'IBM Plex Sans', sans-serif",
            background: '#f5f8fb',
            minHeight: '100vh',
            color: '#10243b',
          }}
        >
          <div style={{ maxWidth: 480, margin: '80px auto' }}>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>PlantãoBot</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#c93e4a' }}>
              Erro inesperado
            </div>
            <p style={{ fontSize: 14, color: '#4c637f', marginBottom: 20 }}>
              Algo deu errado. Tente recarregar a página ou limpar o cache do navegador.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#0b5fff',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: 10,
              }}
            >
              Recarregar
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: '#4c637f',
                border: '1px solid #cfdae7',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Limpar cache e recarregar
            </button>
            <details style={{ marginTop: 24 }}>
              <summary style={{ fontSize: 12, color: '#6f8298', cursor: 'pointer' }}>
                Detalhes do erro
              </summary>
              <pre
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: '#6f8298',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {String(this.state.error)}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
