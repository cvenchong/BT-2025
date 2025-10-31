(function(){
  const $id = (id) => document.getElementById(id);
  var state = { btClient: null, ppInstance: null, deviceDataInstance: null };

  // UI Components
  const UI = {
    elements: {
      //googlepayContainer: document.querySelector('#googlepayContainer')
    }
  }

  function readConfig() {
		return {
			amount: $id('amount').value,
			currency: $id('currency').value,
      intent: $id('intent').value,
      maid: $id('maid').value,
      customerId: $id('customerId').value.trim() || null,
			flow: $id('flow').value,
      enablePayLater: $id('enablePayLater').checked,
      requireShipping: $id('requireShipping').checked,
      shippingPref: $id('shippingPref').value,
      isDeviceDataRequired: $id('device-data-required').checked,
      returnUrl: $id('returnUrl').value.trim() || null,
      cancelUrl: $id('cancelUrl').value.trim() || null
    }
	}

  function onInit(){
    Playground.log( 'Initializing...');
    var config = readConfig();

    //var customerId = document.getElementById('customerId').value || null;
    var customerId =  null;
    Playground.fetchClientToken(customerId).then(function(res){
      var clientToken = res.clientToken || res;
      
      //init braintree client
      braintree.client.create({
        authorization: clientToken
      }).then(function (clientInstance) {
        state.btClient = clientInstance;
        Playground.log( 'Braintree Client Initialized');
        
        return braintree.paypalCheckout.create({
          client: clientInstance,
          merchantAccountId: config.maid || undefined
        });
      }).then(function (paypalCheckoutInstance) {
        state.ppInstance = paypalCheckoutInstance;
        Playground.log( 'PayPal Checkout Instance Initialized (maid: ' + (config.maid || 'default') + ')');

        paypalCheckoutInstance.loadPayPalSDK({
          //'client-id': 'PayPal Client Id', // Can speed up rendering time to hardcode this value
          intent: config.intent, // Make sure this value matches the value in createPayment
          currency: config.currency, // Make sure this value matches the value in createPayment
        }).then(function (paypalCheckoutInstance) {
          // window.paypal.Buttons is now available to use
          // Set up PayPal
          return paypal.Buttons({
            fundingSource: paypal.FUNDING.PAYPAL,

            createOrder: function () {
              //createOrder is called
              Playground.log( 'createOrder called');

              createPaymentRequestOptions = {
                flow: 'checkout',
                requestBillingAgreement: false, //build a checkout to toggle this value
                
                currency: config.currency,
                amount: config.amount,
                intent: config.intent // this value must either be `capture` or match the intent passed into the PayPal SDK intent query parameter
                // your other createPayment options here
              }
                
              return paypalCheckoutInstance.createPayment(createPaymentRequestOptions);
            },

            onApprove: function (data, actions) {
              Playground.log( 'onApprove called, data: ' + JSON.stringify(data, null, 2));
              // some logic here before tokenization happens below
              return paypalCheckoutInstance.tokenizePayment(data).then(function (payload) {
                Playground.log( 'tokenizePayment returned payload: ' + JSON.stringify(payload, null, 2));
                // Submit payload.nonce to your server
                Playground.getJSON('/api/payments/paypal/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    paymentMethodNonce: payload.nonce,
                    merchantAccountId: config.maid || null,
                    amount: config.amount,
                    payerId: payload.details.payerId,
                    deviceData: state.deviceDataInstance ? state.deviceDataInstance.deviceData : null,
                    intent: config.intent,
                    customerId: config.customerId,
                    isDeviceDataRequired: config.isDeviceDataRequired,
                    returnUrl: config.returnUrl,
                    cancelUrl: config.cancelUrl
          
                  })
                }).then(function(response){ 
                  Playground.log( 'Server response: ', response);
                }).catch(function(err){
                  Playground.logError( 'Error sending nonce to server', err);
                });
              });
            },

            onCancel: function () {
              Playground.log( 'onCancel called');
              // handle case where user cancels
            },

            onError: function (err) {
              Playground.log( 'onError called');
              // handle case where error occurs
            }
          }).render('#paypal-button');
        }).catch(function (err) {
          Playground.logError('Error loading PayPal SDK script', err);
        });


        
      }).catch(function (err) {
        Playground.logError('Error creating PayPal Checkout', err);
      });

    });
  }

  document.getElementById('init').addEventListener('click', onInit);
})();