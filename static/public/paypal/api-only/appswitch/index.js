

//const BASE_URL = "http://10.0.2.2:8888";
const UI = {
  elements: {
    configToggle: document.getElementById('configToggle'),
    configContent: document.getElementById('configContent'),
    orderPayload: document.getElementById('orderPayload'),
    jsonError: document.getElementById('jsonError'),
    payerEmail: document.getElementById('payerEmail'),
    enableAppSwitch: document.getElementById('enableAppSwitch'),
    userActionPayNow: document.getElementById('payNow'),
    userActionContinue: document.getElementById('continue'),
    returnFlowAuto: document.getElementById('autoFlow'),
    returnFlowManual: document.getElementById('manualFlow'),
    initBtn: document.getElementById('initBtn'),
    logSection: document.getElementById('log-section'),
    shippingPreference: document.getElementById('shippingPreference'),
    brandName: document.getElementById('brandName')
  }
};

function readConfig() {
  // Read and validate JSON payload
  let payload;
  try {
    payload = JSON.parse(UI.elements.orderPayload.value);
  } catch (e) {
    payload = null;
  }

  // Get user_action
  let userAction = UI.elements.userActionPayNow.checked ? "PAY_NOW" : "CONTINUE";

  // Get payer email
  let payerEmail = UI.elements.payerEmail.value;

  // AppSwitch enabled
  let enableAppSwitch = UI.elements.enableAppSwitch.checked;

  // Return flow
  let returnFlow = UI.elements.returnFlowAuto.checked ? "AUTO" : "MANUAL";

  const BASE_URL = 'https://bt-2025.onrender.com'
  let return_cancel_url = BASE_URL + '/public/paypal/api-only/appswitch/index.html';
  console.log('Return cancel URL:', return_cancel_url);
  const currencyCode = "USD";
  const amount = "10.00";
  const buyerCountry = "US";
  const intent = 'CAPTURE';

  let shipping_preference = UI.elements.shippingPreference.value;
  let brand_name = UI.elements.brandName.value;


  let { userAgent, deviceType } = getUserAgentAndDeviceType();

  return {
    payload,
    userAction,
    payerEmail,
    enableAppSwitch,
    returnFlow,
    return_cancel_url,
    currencyCode,
    amount,
    buyerCountry,
    intent,
    shipping_preference,
    brand_name,
    userAgent,
    deviceType
  };
}


function validateCreateOrderPayload(payload) {
  const orderPayload = UI.elements.orderPayload;
  const jsonError = UI.elements.jsonError;
  try {
    payload = JSON.parse(orderPayload.value);
    orderPayload.classList.remove('json-invalid');
    jsonError.style.display = 'none';
    return true;
  } catch (e) {
    orderPayload.classList.add('json-invalid');
    jsonError.textContent = 'Invalid JSON: ' + e.message;
    jsonError.style.display = 'block';
    return false;
  }
}

function buildCreateOrderRequestPayload(orderID, customID) {
  var config = readConfig();
  //sample one time from mihoyo
  //   {
  //     "application_context": {
  //         "brand_name": "Cognosphere Pte Ltd",
  //         "cancel_url": "https://sdk.hoyoverse.com/default/payment/global-platform/action/index.html?hyvPaymentId=id_665814a1-486a-42d0-b8a8-e0d76ed63083&hoyoverseResult=cancel_actively",
  //         "shipping_preference": "NO_SHIPPING",
  //         "return_url": "https://sdk.hoyoverse.com/default/payment/global-platform/action/index.html?hyvPaymentId=id_665814a1-486a-42d0-b8a8-e0d76ed63083",
  //         "user_action": "PAY_NOW"
  //     },
  //     "intent": "CAPTURE",
  //     "payment_source": {
  //         "paypal": {
  //             "attributes": {
  //                 "customer": {
  //                     "id": "154821858"
  //                 }
  //             }
  //         }
  //     },
  //     "purchase_units": [
  //         {
  //             "amount": {
  //                 "currency_code": "EUR",
  //                 "value": "9.99"
  //             },
  //             "custom_id": "hkrpg_global",
  //             "invoice_id": "1978702933818122240",
  //             "description": "Nameless Glory"
  //         }
  //     ]
  // }

  payload = {
    //refer above sample to build payload
    // application_context: {
    //   brand_name: config.brand_name,
    //   cancel_url: config.return_cancel_url,
    //   shipping_preference: config.shipping_preference,
    //   return_url: config.return_cancel_url,
    //   user_action: config.userAction
    // },
    intent: config.intent,
    purchaseUnits: [{
      description: "Test purchase",
      amount: {
        currency_code: config.currencyCode,
        value: config.amount
      }
    }],
    paymentSource: {
      paypal: {
        experience_context: {
          brand_name: config.brandName,
          shipping_preference: config.shipping_preference,
          user_action: config.userAction,
          return_url: config.return_cancel_url,
          cancel_url: config.return_cancel_url,
          app_switch_preference: {
            launch_paypal_app: config.enableAppSwitch
          }
        },
        payer: {
          email_address: config.payerEmail
        }
      }
    }
  }
  if (orderID && orderID.length > 0) {
    payload.orderID = orderID;
  }
  if (customID && customID.length > 0) {
    payload.customID = customID;
  }
  return payload;
}

function setReturnFlowHandling() {
  var returnFlow = document.querySelector('input[name="returnFlow"]:checked').value;
  console.log("Selected return flow:", returnFlow);

  if (returnFlow === "AUTO") {
    //init visbility change handling - Use the visibilitychange event listener to handle scenarios where the payer abandons the checkout
    document.addEventListener('hashchange', (e) => {
      console.log('this is auto flow return handling... ')
      const params = parseHashParams(window.location.hash);
      console.log('Parsed hash parameters:', params);
      if (params.approved) {
        console.log('Buyer is returning from app switch with an approved order');
        // Buyer is returning from app switch with an approved order
        // Verify the order approval, complete payment
        // & redirect to confirmation page to complete flow
      } else if (params.canceled) {
        // Buyer canceled PayPal app switch
        console.log('Buyer canceled PayPal app switch');
      }
    })
  }
  else {
    //init manual flow handling
    document.addEventListener('visibilitychange', (e) => {
      // call your server API to make a request to PayPal to get the order status and buyer cancellation status (if applicable)

      //If #change event was triggered then cancel this event (to avoid multiple payment/order calls from both the listeners)
      const hashParams = parseHashParams(window.location.hash);
      if (hashParams.approved || hashParams.cancelled) {
        //Wil be handled by hashChange. Exit
        return;
      }

      const orderResponse = getOrderResponse(orderId);
      const orderStatus = orderResponse.status;
      const cancelledActivity = orderResponse?.payment_source?.paypal?.experience_status;

      //Order Approved
      if (orderStatus === 'approved') {
        // Capture payment & redirect to confirmation page
      }

      //Buyer cancels transaction
      else if (orderStatus !== 'approved' && cancelledActivity == 'cancelled') {
        // Buyer app switched to paypal but closed checkout before approving the transaction. 
        // Display Cart page again or take the appropriate "cancel" action 
      }

      else {
        // Display a modal to complete payment on the PayPal App
      }
    });
  }

}

function getUserAgentAndDeviceType() {
  const ua = navigator.userAgent;
  console.log('User Agent:', ua);

  let deviceType = "unknown";
  // Mobile device (phone/tablet)
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase())) {
    // Check for in-app browser (common ones)
    if (/FBAN|FBAV|Instagram|Line|Twitter|Snapchat|Messenger|WhatsApp|WeChat|TikTok/i.test(ua)) {
      deviceType = "mobile-in-app-browser";
    } else {
      deviceType = "mobile-web";
    }
  } else {
    // Desktop
    deviceType = "desktop";
  }
  console.log('Detected device type:', deviceType);
  return { userAgent: ua, deviceType: deviceType };
}

function buildAppSwitchContext() {
  var config = readConfig();

  let context;
  if (config.enableAppSwitch && config.deviceType === "mobile-web") {
    context = {
      mobile_web: {
        return_flow: config.returnFlow,
        buyer_user_agent: config.userAgent
      }
    };
  }
  return context;

}

function initConfig() {
  const configToggle = UI.elements.configToggle;
  const configContent = UI.elements.configContent;
  let expanded = true; // default to expanded

  // Set initial state to expanded
  configContent.classList.add('active');
  configToggle.innerHTML = '&#9660; Configuration <span>(click to collapse)</span>';

  configToggle.onclick = function () {
    expanded = !expanded;
    configContent.classList.toggle('active', expanded);
    configToggle.innerHTML = expanded
      ? '&#9660; Configuration <span>(click to collapse)</span>'
      : '&#9654; Configuration <span>(click to expand)</span>';
  };

  // set a sample order payload to textarea
  var config = readConfig();

  const orderPayload = UI.elements.orderPayload;
  orderPayload.value = JSON.stringify({
    intent: config.intent,
    purchase_units: [{
      reference_id: "ref-001",
      description: "Test purchase",
      amount: {
        currency_code: config.currencyCode,
        value: config.amount
      }
    }],
    payment_source: {
      paypal: {
        email_address: config.payerEmail,
        experience_context: {
          brand_name: config.brandName,
          shippingPreference: config.shippingPreference,
          user_action: config.userAction,
          return_url: config.return_cancel_url,
          cancel_url: config.return_cancel_url,
          app_switch_preference: buildAppSwitchContext()
        }
      }
    }
  }, null, 2);

  // JSON validation logic
  const jsonError = UI.elements.jsonError;
  orderPayload.addEventListener('input', function () {
    try {
      JSON.parse(orderPayload.value);
      orderPayload.classList.remove('json-invalid');
      jsonError.style.display = 'none';
    } catch (e) {
      orderPayload.classList.add('json-invalid');
      jsonError.textContent = 'Invalid JSON: ' + e.message;
      jsonError.style.display = 'block';
    }
  });

  // Init button logic
  document.getElementById('initBtn').onclick = function () {
    //collapse config
    configContent.classList.remove('active');
    configToggle.innerHTML = '&#9654; Configuration <span>(click to expand)</span>';

    //set auto/manual flow handling
    var returnFlow = document.querySelector('input[name="returnFlow"]:checked').value;
    console.log("Selected return flow:", returnFlow);


    var config = readConfig();
    // Validate JSON
    let payload = config.payload;
    if (!validateCreateOrderPayload(payload)) {
      console.error("Invalid createOrder payload - not json formatted");
      return;
    }

    console.log('replace orderID and customID...')
    //how to generate random uuid in javascript
    var orderID = crypto.randomUUID();
    console.log("Using Order ID: ", orderID);
    var customID = 'pp custom id ' + orderID;
    console.log("Using Custom ID: ", customID);
    payload.orderID = orderID;
    payload.customID = customID;

    //detect if app switch supported. if not, opt out

    console.log("Final payload:", payload);
    console.log("Sending order creation request...");
    //send order creation request to server
    fetch('/create_pp_order_v2_raw_payload', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        return response.json();
      })
      .then((orderData) => {
        console.log("Order created:", orderData.order_response);
        return orderData.order_response;
      })
      .then((order_response) => {
        //check app_switch_eligibility flag
        // This flag indicates that the information in the Create Order request is correct, 
        // and that PayPal has found the payer eligible. The merchant should attempt to App Switch. 
        //app_switch_eligibility = true does not guarantee that the payer will switch to the PayPal app. 
        // It only indicates that PayPal requests the merchant to attempt App Switch for the payer.
        console.log('app switch experience enabled? ', config.enableAppSwitch);
        console.log('this is a experience for return_flow: ', config.returnFlow);
        let app_switch_eligibility = order_response?.payment_source?.paypal?.app_switch_eligibility ?? false;
        console.log("App Switch Eligibility: ", app_switch_eligibility);

        //extract full page redirect url from order_response from PayPal order v2 hateos links
        let redirect_url = null;
        if ((order_response ?? null) !== null && (order_response.links ?? null) !== null) {
          for (let i = 0; i < order_response.links.length; i++) {
            const link = order_response.links[i];
            if (link.rel === 'payer-action') {
              redirect_url = link.href;
              break;
            }
          }
        }
        if ((redirect_url ?? null) === null) {
          console.error("No redirect_url found in order creation response");
          return;
        }

        //trigger redirect 
        window.location.href = redirect_url;
      })
      .catch((error) => {
        console.error("Error creating order:", error);
      });

  };
}


function appendLog(msg, type = "log") {
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
console.log = function (...args) {
  origLog.apply(console, args);
  appendLog(args.map(a => typeof a === "object" ? JSON.stringify(a) : a).join(" "), "log");
};
console.error = function (...args) {
  origError.apply(console, args);
  appendLog(args.map(a => typeof a === "object" ? JSON.stringify(a) : a).join(" "), "error");
};
console.warn = function (...args) {
  origWarn.apply(console, args);
  appendLog(args.map(a => typeof a === "object" ? JSON.stringify(a) : a).join(" "), "warn");
};
console.info = function (...args) {
  origInfo.apply(console, args);
  appendLog(args.map(a => typeof a === "object" ? JSON.stringify(a) : a).join(" "), "info");
};

function parseHashParams(hash) {
  // Remove leading '#' if present
  hash = hash.startsWith('#') ? hash.substring(1) : hash;
  const params = {};
  hash.split('&').forEach(function (kv) {
    const [key, value] = kv.split('=');
    if (key) params[key] = value || true;
  });
  return params;
}

function onLoadHash() {
  console.log('onLoadHash called, checking for hash params...');
  console.log('Current URL hash:', window.location.hash);
  const hashParams = parseHashParams(window.location.hash);
  console.log('Hash parameters after parsing:', hashParams);

  if (hashParams.approved) {
    // Buyer is returning from app switch
    console.log('Buyer is returning from app switch with an approved order');
    // Complete payment & redirect to confirmation page
  } else if (hashParams.canceled) {
    // Buyer has canceled app switch and returned
    console.log('Buyer canceled PayPal app switch');
  } else {
    //it could also be a normal approve flow for web checkout, server side should handle this and redirect to confirmation page

    // No hash params, display standard checkout page
    console.log('No hash params, displaying standard checkout page');
    initConfig();
  }

}


function main() {
  // Your main function logic here
  //auto flow
  onLoadHash();
}

// async function getClientToken() {
//   try {
//     const clientToken = await fetch('/getPPClientToken', {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       }
//     });

//     const clientTokenJson = await clientToken.json();
//     console.log("Client Token: ", clientTokenJson.token);

//     return clientTokenJson.token;
//   } catch (err) {
//     throw new Error(err);
//     return null;
//   }
// }

// async function createOrder() {
//   try {
//     const order = await fetch('/create_pp_order_v2', {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         vaultOnSuccess: "CAPTURE",
//       }),
//     });

//     const orderData = await order.json();
//     console.log("Order created:", orderData);
//     return orderData;
//   } catch (error) {
//     console.error("Error creating order:", error);
//   }
// }

// function main() {
//   // eslint-disable-next-line no-undef
//   if ((paypal ?? null) === null) {
//     console.error("No paypal object with associated loaded PayPal script");
//     document.getElementById("feedback").innerHTML = "Error loading scripts";
//     document.getElementById("error").innerHTML =
//       "No paypal object with associated loaded PayPal script";
//     return;
//   }
//   // eslint-disable-next-line no-undef
//   if ((paypal.Buttons ?? null) === null) {
//     console.error("No Buttons method with associated paypal object");
//     document.getElementById("feedback").innerHTML = "Error loading scripts";
//     document.getElementById("error").innerHTML =
//       "No Buttons method with associated paypal object";
//     return;
//   }

//   // eslint-disable-next-line no-undef
//   const buttons = paypal.Buttons({
//     appSwitchWhenAvailable: true,
//     async createOrder() {
//       console.log("Received order creation request");

//       console.log("Attempting to create order");
//       return fetch(`${BASE_URL}/paypal/rest/order/new`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           intent: "CAPTURE",
//           purchaseUnits: [
//             {
//               reference_id: "asdf",
//               description: "qwerty",
//               amount: {
//                 currency_code: "USD",
//                 value: "78.50",
//               },
//               // crypto.randomUUID() which is usually used to generate a UUID isn't available on Chrome on Android
//               // invoice_id: crypto.randomUUID(),
//               invoice_id: "10000000-1000-4000-8000-100000000000".replace(
//                 /[018]/g,
//                 (c) =>
//                   (
//                     +c ^
//                     (crypto.getRandomValues(new Uint8Array(1))[0] &
//                       (15 >> (+c / 4)))
//                   ).toString(16)
//               ),
//             },
//           ],
//           paymentSource: {
//             paypal: {
//               experience_context: {
//                 user_action: "PAY_NOW",
//                 // use 10.0.2.2 URL when using localhost/10.0.2.2, use playgroundappswitch.infinityfreeapp.com when hosting this on the web domain
//                 return_url:
//                   "http://10.0.2.2:5500/public/paypal/js-sdk/rest/app-switch/index.html",
//                 cancel_url:
//                   "http://10.0.2.2:5500/public/paypal/js-sdk/rest/app-switch/index.html",
//                 // return_url:
//                 //   "https://playgroundappswitch.infinityfreeapp.com/paypal/index.html",
//                 // cancel_url:
//                 //   "https://playgroundappswitch.infinityfreeapp.com/paypal/index.html",
//                 app_switch_preference: {
//                   launch_paypal_app: true,
//                 },
//               },
//             },
//           },
//           merchantCountry: "US",
//         }),
//       })
//         .then(async (response) => {
//           if (response.status === 201) {
//             return response.json();
//           } else {
//             throw new Error((await response.json())?.message);
//           }
//         })
//         .then((data) => {
//           if ((data?.id ?? null) === null) {
//             throw new Error("No order ID with associated created order");
//           }

//           return data.id;
//         })
//         .then((orderId) => {
//           console.log(`Order with ID ${orderId} successfully created`);
//           document.getElementById(
//             "feedback"
//           ).innerHTML = `Order with ID ${orderId} successfully created`;
//           document.getElementById("error").innerHTML = "";
//           return orderId;
//         })
//         .catch(() => {
//           document.getElementById("feedback").innerHTML =
//             "Error creating order";
//           return undefined;
//         });
//     },
//     onApprove(data) {
//       if ((data ?? null) === null) {
//         document.getElementById("feedback").innerHTML = "Error approving order";
//         throw new Error("No data object with associated approval data");
//       }
//       if ((data.orderID ?? null) === null) {
//         document.getElementById("feedback").innerHTML = "Error approving order";
//         throw new Error("No orderID attribute with associated data object");
//       }

//       console.log("Received order approval event");

//       console.log("Attempting to capture order");
//       fetch(`${BASE_URL}/paypal/rest/order/capture`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           orderId: data.orderID,
//           merchantCountry: "US",
//         }),
//       })
//         .then(async (response) => {
//           if (response.status === 201) {
//             console.log(`Order with ID ${data.orderID} successfully captured`);
//             document.getElementById(
//               "feedback"
//             ).innerHTML = `Order with ID ${data.orderID} successfully captured`;
//             document.getElementById("error").innerHTML = "";
//           } else {
//             throw new Error((await response.json())?.message);
//           }
//         })
//         .catch(() => {
//           document.getElementById("feedback").innerHTML =
//             "Error approving order";
//         });
//     },
//     onCancel(data) {
//       if ((data ?? null) === null) {
//         document.getElementById("feedback").innerHTML =
//           "Error in cancel order callback";
//         throw new Error("No data object with associated cancel data");
//       }
//       if ((data.orderID ?? null) === null) {
//         document.getElementById("feedback").innerHTML =
//           "Error in cancel order callback";
//         throw new Error("No orderID attribute with associated data object");
//       }

//       document.getElementById(
//         "feedback"
//       ).innerHTML = `Order with ID ${data.orderID} was cancelled`;
//       document.getElementById("error").innerHTML = "";
//       console.log(`Order with ID ${data.orderID} was cancelled`);
//     },
//     onError(error) {
//       console.error(error);
//       document.getElementById("error").innerHTML = error.message;
//     },
//   });

//   if (buttons.hasReturned()) {
//     console.log("Received buttons returned callback");
//     buttons.resume();
//   } else {
//     buttons.render("#container");
//   }
// }



main();
