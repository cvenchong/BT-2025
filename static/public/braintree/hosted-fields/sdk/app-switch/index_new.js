// NOTE: In Android Studio emulator, use 10.0.2.2 to access anything locally hosted on the actual device
//const BASE_URL = "http://127.0.0.1:5000";
//const BASE_URL = "http://bt-steven-2025.ap-southeast-1.elasticbeanstalk.com"; // TODO: change to your own domain
const BASE_URL = 'https://bt-2025.onrender.com'
let return_cancel_url = BASE_URL + '/public/braintree/hosted-fields/sdk/app-switch/index_new.html';
const merchantAccountId = "stevenustest";
const currencyCode = "USD";
const amount = "10.00";
const buyerCountry = "US";
const intent = 'capture';
var state = { btClient: null, btDeviceDataCollectorInstance: null, btPayPalInstance: null, btGPInstance: null, googlePaymentClient: null, btThreeDS: null, btDeviceData: null };
//const BASE_URL = "http://10.0.2.2:8888";

function appendLog(msg, type="log") {
  const logDiv = document.getElementById("log-section");
  if (!logDiv) return;
  const el = document.createElement("div");
  const now = new Date();
  const timestamp = now.toLocaleTimeString();
  el.textContent = `[${timestamp}] [${type}] ${msg}`;
  el.style.whiteSpace = "pre-wrap"; // allow new lines
  if (type === "error") {
    el.style.color = "#ff6b6b"; // red for errors
  } else {
    el.style.color = "#fff"; // white for normal logs
  }
  logDiv.appendChild(el);
  logDiv.scrollTop = logDiv.scrollHeight;
}

// Save original console methods
const origLog = console.log;
const origError = console.error;
const origWarn = console.warn;
const origInfo = console.info;

// Override console methods
console.log = function(...args) {
  origLog.apply(console, args);
  appendLog(args.map(a => typeof a === "object" ? JSON.stringify(a) : a).join(" "), "log");
};
console.error = function(...args) {
  origError.apply(console, args);
  appendLog(args.map(a => typeof a === "object" ? JSON.stringify(a) : a).join(" "), "error");
};
console.warn = function(...args) {
  origWarn.apply(console, args);
  appendLog(args.map(a => typeof a === "object" ? JSON.stringify(a) : a).join(" "), "warn");
};
console.info = function(...args) {
  origInfo.apply(console, args);
  appendLog(args.map(a => typeof a === "object" ? JSON.stringify(a) : a).join(" "), "info");
};


async function getClientToken() {
    console.log("getting MAID: ", merchantAccountId);
    try {
        const clientToken = await fetch('/braintree/sdk/auth/client', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merchantAccountId: merchantAccountId,
          }),
        });

        const clientTokenJson = await clientToken.json();
        console.log("Client Token: ", clientTokenJson.token);

        return clientTokenJson.token;
    } catch (err) {
        throw new Error(err);
        return null;
    }
}

async function submitNonceToServer(nonce) {
  try {
    const response = await fetch('/braintree/sdk/auth/nonce', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nonce: nonce,
      }),
    });

    const responseJson = await response.json();
    console.log("Server Response: ", responseJson);
  } catch (err) {
    console.error("Error submitting nonce to server: ", err);
  }
}

async function initBT() {
    console.log("Attempting to get client token");
    var clientToken = await getClientToken();

    braintree.client.create({
      authorization: clientToken
    }).then(function (clientInstance) {
      state.btClient = clientInstance;
      //console.log("Braintree Client Instance: ", clientInstance);
          // Create a PayPal Checkout component.
       return braintree.paypalCheckout.create({
          client: clientInstance
        });
    }).then(function (paypalCheckoutInstance) {
      state.btPayPalInstance = paypalCheckoutInstance;
      //console.log("PayPal Checkout Instance: ", paypalCheckoutInstance);
        // Base PayPal SDK script options
        var loadPayPalSDKOptions = {
          currency: currencyCode, // Must match the currency passed in with createPayment
          intent: intent, // Must match the intent passed in with createPayment
          commit: true // Required for Pay Now flow with App Switch
        }
        console.log("Loading PayPal SDK with options: ", loadPayPalSDKOptions);

        paypalCheckoutInstance.loadPayPalSDK(loadPayPalSDKOptions, function () {
          console.log("PayPal SDK loaded", paypalCheckoutInstance);
          const button = paypal.Buttons({
            fundingSource: paypal.FUNDING.PAYPAL,
            appSwitchWhenAvailable: true, // Indicator to trigger app switch
            createOrder: function () {
              // Base payment request options for one-time payments
              var createPaymentRequestOptions = {
                flow: 'checkout', // Required
                userAction: 'COMMIT',
                amount: amount, // Required
                currency: currencyCode, // Required, must match the currency passed in with loadPayPalSDK
                intent: intent, // Must match the intent passed in with loadPayPalSDK
                // App Switch specific options
                returnUrl: return_cancel_url,
                cancelUrl: return_cancel_url
              };

              console.log("createPaymentRequestOptions: ", createPaymentRequestOptions);
              
              return paypalCheckoutInstance.createPayment(createPaymentRequestOptions);
            },
            onApprove: function (data, actions) {
                console.log( 'onApprove data: ' + JSON.stringify(data, null, 2));
                // Submit payload.nonce to your server
                return paypalCheckoutInstance.tokenizePayment(data).then(function (payload) {
                  console.log( 'tokenizePayment returned payload: ' + JSON.stringify(payload, null, 2));
                  // Submit payload.nonce to your server
                  return fetch('/api/payments/paypal/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      paymentMethodNonce: payload.nonce,
                      merchantAccountId: merchantAccountId || null,
                      amount: amount,
                      payerId: payload.details.payerId,
                      deviceData: state.deviceDataInstance ? state.deviceDataInstance.deviceData : null,
                      intent: intent,
                      customerId: null,
                      isDeviceDataRequired: null,
                      returnUrl: return_cancel_url,
                      cancelUrl: return_cancel_url

                    })
                  }).then(function(response){ 
                    return response.json(); // Parse the JSON from the response
                  }).then(function(data) {
                    console.log( 'Server response: ', data);
                  }).catch(function(err){
                    console.error( 'Error sending nonce to server', err);
                  });
                });
            },
            onCancel: function (data) {
              console.log('PayPal payment cancelled', JSON.stringify(data, 0, 2));
            },
            onError: function (err) {
              console.error('PayPal error', err);
            }
          });

          // If you support app switch, depending on the browser the buyer may end up in a new tab
          // To trigger completion of the flow, execute the code below after re-instantiating buttons
          if (button.hasReturned()) {
            console.log("App switch completed => button.resume() is called.."); 
            button.resume();
            
          } else {
            button.render('#paypal-button').then(function () {
              // The PayPal button will be rendered in an html element with the ID
              // 'paypal-button-container'. This function will be called when the PayPal button
              // is set up and ready to be used
            });
          }
        });
      });
}



function main() {
    initBT();
}

main();
