import { SigmaClientProvider } from '@sigmacomputing/plugin';
import type { PluginInstance } from '@sigmacomputing/plugin';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { buildMockConfig, buildMockElements, type MockElement } from './mockData';

/**
 * Hand-built PluginInstance that backs the app with in-memory mock data
 * instead of postMessage calls to a Sigma workbook. `config.set`/`setKey`
 * actually mutate state and notify subscribers, so the Settings panel is
 * fully interactive here too — this exercises the real App.tsx, not a
 * simplified stand-in.
 */
// Built as a plain object (not type-annotated against PluginInstance) and
// cast at the end — implementing PluginInstance's generic method signatures
// directly runs into TS limitations checking generic method bodies against
// object-literal implementations. A single cast at the boundary is simpler
// and just as safe for this dev-only harness.
function createMockClient(initialConfig: Record<string, unknown>, elements: Record<string, MockElement>) {
  let config: Record<string, unknown> = { ...initialConfig };
  const configListeners = new Set<(c: Record<string, unknown>) => void>();

  const notifyConfig = () => configListeners.forEach((cb) => cb(config));

  const client = {
    sigmaEnv: 'author' as const,
    isScreenshot: false,

    config: {
      get: () => config,
      getKey: (key: string) => config[key],
      set: (partial: Record<string, unknown>) => {
        config = { ...config, ...partial };
        notifyConfig();
      },
      setKey: (key: string, value: unknown) => {
        config = { ...config, [key]: value };
        notifyConfig();
      },
      subscribe: (listener: (c: Record<string, unknown>) => void) => {
        configListeners.add(listener);
        listener(config);
        return () => configListeners.delete(listener);
      },
      getVariable: () => undefined,
      setVariable: () => {},
      getInteraction: () => [],
      setInteraction: () => {},
      triggerAction: (configId: string) => console.log('[mock] triggerAction', configId),
      registerEffect: () => () => {},
      configureEditorPanel: (options: unknown) => console.log('[mock] configureEditorPanel', options),
      setLoadingState: (loading: boolean) => console.log('[mock] setLoadingState', loading),
      subscribeToWorkbookVariable: () => () => {},
      subscribeToUrlParameter: () => () => {},
      getUrlParameter: () => ({ value: '' }),
      setUrlParameter: () => {},
      subscribeToWorkbookInteraction: () => () => {},
    },

    elements: {
      getElementColumns: async (configId: string) => elements[configId]?.columns ?? {},
      subscribeToElementColumns: (configId: string, callback: (cols: unknown) => void) => {
        callback(elements[configId]?.columns ?? {});
        return () => {};
      },
      subscribeToElementData: (configId: string, callback: (data: unknown) => void) => {
        callback(elements[configId]?.data ?? {});
        return () => {};
      },
      fetchMoreElementData: () => {},
    },

    style: {
      subscribe: () => () => {},
      get: async () => ({ backgroundColor: '#ffffff' }),
    },

    destroy: () => {},
  };

  return client as unknown as PluginInstance<Record<string, unknown>>;
}

export function MockPluginProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<PluginInstance<Record<string, unknown>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildMockElements().then((elements) => {
      if (cancelled) return;
      setClient(createMockClient(buildMockConfig(), elements));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!client) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', fontSize: 14, color: '#475569' }}>
        Loading mock data…
      </div>
    );
  }

  return <SigmaClientProvider client={client}>{children}</SigmaClientProvider>;
}
