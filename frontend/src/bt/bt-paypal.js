import * as braintree from 'braintree-web';

//const API_BASE = 'http://localhost:5000'; // Flask
//const BASE_URL = 'https://bt-2025.onrender.com'
//const API_BASE = BASE_URL; // Render.com
// Use Vite env var in prod, localhost for dev
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function setupBraintreeAndPayPalButtons({
    container,
    amount = '10.00',
    currency = 'USD',
    mode = 'broken', // 'broken' | 'fixed'
    intent = 'capture',
    onLog = () => { } // <-- NEW
}) {
    const t = () => new Date().toISOString();
    const log = (msg, data) => onLog(`[${t()}] ${msg}`, data);

    // 1) Get BT client token from Flask
    const tokenRes = await fetch(`${API_BASE}/api/playground/client_token`);
    const { clientToken } = await tokenRes.json();
    if (!clientToken) throw new Error('No client token');
    log('Fetched client token', clientToken); // <-- NEW

    // 2) Create client + PayPal Checkout instance
    const clientInstance = await braintree.client.create({ authorization: clientToken });
    const paypalCheckoutInstance = await braintree.paypalCheckout.create({ client: clientInstance });
    log('Created BT client + paypalCheckout instance');

    // 3) Load PayPal SDK via BT helper
    await paypalCheckoutInstance.loadPayPalSDK({
        //components: 'buttons',
        currency,
        intent,
        commit: true
    });
    log('Loaded PayPal JS SDK via BT helper');

    const origin = window.location.origin;
    const returnUrl = mode === 'fixed'
        ? `${origin}/paypal-bridge.html` // interstitial (fix)
        : `${origin}/`;                   // SPA entry (broken; router owns the hash)
    //const cancelUrl = `${origin}/paypal-bridge.html#cancel=1`;
    const cancelUrl = returnUrl;
    log('Configured return/cancel URLs', { returnUrl, cancelUrl, mode });

    // 4) Render Buttons (App Switch enabled)
    const button = window.paypal.Buttons({
        appSwitchWhenAvailable: true,
        style: { shape: 'pill', label: 'paypal' },

        createOrder: async () => {
            const paymentId = await paypalCheckoutInstance.createPayment({
                flow: 'checkout',
                userAction: 'COMMIT',
                amount,
                currency,
                returnUrl,
                cancelUrl,
                intent
            });
            log('CreateOrder triggered. createPayment completed', { paymentId });
            return paymentId;
        },

        onApprove: async (data) => {
            log('onApprove called', data);
            let on_approved_order_id = data.orderID;
            const payload = await paypalCheckoutInstance.tokenizePayment(data);
            log('tokenizePayment payload (nonce)', { nonce: payload.nonce });

            // Send nonce to Flask (sandbox sale)
            log('Sending nonce to server for sale…', { amount, orderId: on_approved_order_id, nonce: payload.nonce });
            const r = await fetch(`${API_BASE}/api/payments/paypal/checkout_appswitch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethodNonce: payload.nonce,
                    amount,
                    isDeviceDataRequired: null,
                    storeInVaultOnSuccess: false,
                    orderId: on_approved_order_id
                })
            });
            const sale = await r.json();
            log('Server Response ', sale);

            window.location.hash = '/confirm';
        },

        onError: (err) => {
            log('PayPal error', { message: err?.message, stack: String(err?.stack || err) });
            alert(err?.message || 'PayPal error');
        },

        onCancel: (data) => {
            log('onCancel', data);
        }
    });

    // 5) Resume after return
    const returned = typeof button.hasReturned === 'function' ? button.hasReturned() : false;
    log('button.hasReturned()', returned);
    if (returned) {
        log('Calling button.resume()…');
        button.resume();
    } else {
        log('Rendering PayPal button…');
        button.render(container);
    }
}
