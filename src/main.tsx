import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const isMock = new URLSearchParams(window.location.search).get('mock') === '1';

async function bootstrap() {
  const root = createRoot(document.getElementById('root')!);

  if (isMock) {
    // Dynamically imported so the mock harness never ships in a normal
    // production build's initial chunk.
    const { MockPluginProvider } = await import('./dev/MockPluginProvider');
    root.render(
      <StrictMode>
        <MockPluginProvider>
          <App />
        </MockPluginProvider>
      </StrictMode>,
    );
    return;
  }

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
