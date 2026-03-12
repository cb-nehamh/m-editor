import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchConfig, createPortalSession } from '../api';
import { buildTree } from '../state';

const CUSTOMERS = [
  'tier-test1',
  ...Array.from({ length: 10 }, (_, i) => `test-customer${i + 1}`),
];
const DEFAULT_DOMAIN = 'yash-pc2-test';

export function PreviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const configId = searchParams.get('id') || '';

  const [customer, setCustomer] = useState(CUSTOMERS[0]);
  const [config, setConfig] = useState<any[] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const mountGenRef = useRef(0);

  useEffect(() => {
    if (!configId) {
      const stored = sessionStorage.getItem('mjs-preview-config');
      if (stored) {
        try {
          setConfig(JSON.parse(stored));
        } catch {
          setError('Invalid preview config in session');
        }
      } else {
        setError('No config ID or preview data provided');
      }
      return;
    }

    setConfigLoading(true);
    fetchConfig(DEFAULT_DOMAIN, configId)
      .then((res) => {
        if (res) {
          const raw = res.config as any;
          const inner = Array.isArray(raw) ? raw[0] : raw;
          if (inner?.sections) {
            setConfig(buildTree(inner.sections));
          } else if (Array.isArray(raw)) {
            setConfig(raw);
          } else {
            setConfig([raw]);
          }
        } else {
          setError('Config not found');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setConfigLoading(false));
  }, [configId]);

  const generateTokenAndMount = useCallback(async (customerId: string) => {
    if (!config) return;

    const gen = ++mountGenRef.current;
    setTokenLoading(true);
    setError(null);

    try {
      const session = await createPortalSession(DEFAULT_DOMAIN, customerId);

      if (gen !== mountGenRef.current) return;

      setToken(session.token);
      setTokenLoading(false);

      const mjs = (window as any).MJS;
      if (!mjs || !portalRef.current) return;

      portalRef.current.innerHTML = '';

      if (typeof mjs.resetSession === 'function') {
        mjs.resetSession();
      }

      mjs.loadPortalComponent('#preview-portal-host', config, {
        domain: DEFAULT_DOMAIN,
        token: session.token,
      });
    } catch (err: any) {
      if (gen !== mountGenRef.current) return;
      setTokenLoading(false);
      setError(`Failed to create session for ${customerId}: ${err.message}`);
    }
  }, [config]);

  useEffect(() => {
    if (config) {
      generateTokenAndMount(customer);
    }
  }, [config, customer, generateTokenAndMount]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCustomer = e.target.value;
    setCustomer(newCustomer);
  };

  const isLoading = configLoading || tokenLoading;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: 'var(--font-sans, system-ui)',
      background: '#f0f2f5',
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '56px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            style={{ padding: '5px 14px' }}
          >
            &larr; Back to Editor
          </button>
          <h1 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            EL-UI Preview
          </h1>
          {configId && (
            <span style={{
              fontSize: '12px',
              color: '#94a3b8',
              background: 'rgba(255,255,255,0.08)',
              padding: '3px 10px',
              borderRadius: '4px',
            }}>
              {configId}
            </span>
          )}
          {token && (
            <span style={{
              fontSize: '11px',
              color: '#4ade80',
              background: 'rgba(74,222,128,0.1)',
              padding: '3px 10px',
              borderRadius: '4px',
            }}>
              Live Session
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
            Customer:
          </label>
          <select
            value={customer}
            onChange={handleCustomerChange}
            disabled={tokenLoading}
            style={{
              padding: '5px 12px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              cursor: tokenLoading ? 'wait' : 'pointer',
              outline: 'none',
              opacity: tokenLoading ? 0.6 : 1,
            }}
          >
            {CUSTOMERS.map((c) => (
              <option key={c} value={c} style={{ color: '#0f172a' }}>{c}</option>
            ))}
          </select>
          {tokenLoading && (
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Generating session...
            </span>
          )}
        </div>
      </header>

      <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        {configLoading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '200px', color: '#64748b', fontSize: '14px',
          }}>
            Loading configuration...
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px',
            height: '200px', color: '#ef4444', fontSize: '14px',
          }}>
            <span>{error}</span>
            <button
              onClick={() => { setError(null); generateTokenAndMount(customer); }}
              className="btn btn-ghost"
              style={{ fontSize: '13px' }}
            >
              Retry
            </button>
          </div>
        )}

        {!configLoading && !error && (
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            minHeight: '400px',
            padding: '32px',
            position: 'relative',
          }}>
            {tokenLoading && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: '12px',
                zIndex: 10,
                fontSize: '14px', color: '#64748b',
              }}>
                Loading customer data...
              </div>
            )}
            <div
              id="preview-portal-host"
              ref={portalRef}
            />
          </div>
        )}
      </div>
    </div>
  );
}
