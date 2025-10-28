import { useEffect, useRef, useState } from 'react';
import { setupBraintreeAndPayPalButtons } from '../bt/bt-paypal';

export default function Checkout() {
  const ref = useRef(null);
  const [mode, setMode] = useState('broken'); // 'broken' or 'fixed'
  const [logs, setLogs] = useState([]);

  const addLog = (msg, data) => {
    setLogs((prev) => [
      ...prev,
      typeof data === 'undefined' ? msg : `${msg}\n${JSON.stringify(data, null, 2)}`
    ]);
  };

useEffect(() => {
  if (!ref.current) return;
  if (ref.current.dataset.initialized) return; // already ran
  ref.current.dataset.initialized = 'true';

  ref.current.innerHTML = '';
  addLog(`Initializing Braintree/PayPal (mode=${mode})…`);
  setupBraintreeAndPayPalButtons({
    container: ref.current,
    amount: '1.00',
    currency: 'USD',
    mode,
    onLog: addLog
  }).catch((e) => addLog('Init failed', { message: e.message }));
}, [mode]);

  const clearLogs = () => setLogs([]);

  return (
    <>
      <h2>Checkout</h2>
      <p>
        Mode:{' '}
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="broken">Broken (return to SPA, router clobbers fragment)</option>
          <option value="fixed">Fixed (return to interstitial bridge)</option>
        </select>
        {' '}
        <button onClick={clearLogs} style={{ marginLeft: 8 }}>Clear Logs</button>
      </p>

      <div ref={ref} id="paypal-button-container" />

      <h3 style={{ marginTop: 16 }}>Logs</h3>
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 8,
          height: 220,
          overflowY: 'auto',
          background: '#fafafa'
        }}
      >
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {logs.length ? logs.join('\n\n— — — — —\n\n') : '(no logs yet)'}
        </pre>
      </div>
    </>
  );
}
