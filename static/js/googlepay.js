(function(){
  const $id = (id) => document.getElementById(id);
  var state = { btClient: null, btDeviceDataCollectorInstance: null, btGPInstance: null, googlePaymentClient: null, btThreeDS: null, btDeviceData: null };
  // UI Components
  const UI = {
    elements: {
      googlepayContainer: document.querySelector('#googlepayContainer')
    }
  }

  function readConfig() {
		return {
			customerId: $id('customer-id').value.trim() || null,
			amount: $id('amount').value,
			currency: $id('currency').value,
      maid: $id('maid').value,
			isThreeDS: $id('enable3ds').checked,
			isSubmitForSettlement: $id('settle').checked,
			isServerVaultOnSuccess: $id('server-vault-on-success').checked,
			countryCode: $id('countryCode').value,
      isGoogleAuthMethodPANOnly: $id('google-auth-method-pan-only').checked,
      isGoogleAuthMethodCryptogram3ds: $id('google-auth-method-cryptogram-3ds').checked,
			//var authMethods = Array.prototype.slice.call(document.querySelectorAll('.authMethod:checked')).map(function(x){return x.value;});
      //paymentDataRequest.allowedAuthMethods = authMethods.length ? authMethods : ['PAN_ONLY','CRYPTOGRAM_3DS']; 
      isBillingRequired: $id('billingRequired').checked,      
      isDeviceDataRequired: $id('device-data-required').checked,


		};
	}


  function enableDisablePay(googlePayButton, isEnable){
    googlePayButton.disabled = !enabled;
  }

  function setupDeviceDataCollector(){
    const config = readConfig();
    Playground.log(`Checking... isDeviceDataRequired: ${config.isDeviceDataRequired}`);
    if (config.isDeviceDataRequired){
      Playground.log('Setting up Device Data Collector... ');
      braintree.dataCollector.create({
        client: state.btClient
      }, function (err, dataCollectorInstance) {
        Playground.log('Device Data Collector is setup... ');
        if (err) {
          // Handle error in creation of data collector
          return;
        }
        state.btDeviceDataCollectorInstance = dataCollectorInstance;
        // At this point, you should access the dataCollectorInstance.deviceData value and provide it
        // to your server, e.g. by injecting it into your form as a hidden input.
        //var deviceData = dataCollectorInstance.deviceData;
        Playground.log('deviceData: ',  state.btDeviceDataCollectorInstance.deviceData);
      });    
    }
  }

  function setupGooglePayButton() {
    const container = UI.elements.googlepayContainer;
    var buttonOptions = {
      buttonColor: 'default',
      buttonType: 'buy',
      buttonRadius: 4,
      buttonBorderType: 'default_border',
      onClick: onPay,
      allowedPaymentMethods: state.btGPInstance.createPaymentDataRequest().allowedPaymentMethods // use the same payment methods as for the loadPaymentData() API call. According to google doc, now only support card. 
    };
    Playground.log('Setting up Google Pay button, button options: ', buttonOptions);
    const button = state.googlePaymentClient.createButton(buttonOptions);
    container.appendChild(button);
    Playground.log('setup and appended GooglePayButton to div');
  }

  function setupThreeDS(){
    const config = readConfig();

    if(config.isThreeDS){
      btThreeDSVersionConfig = '2';
      braintree.threeDSecure.create({ 
        version: btThreeDSVersionConfig,
        //version: '1', //this is no longer supported despite that io doc said default!
        //version: '2',  // v2 3D Secure component using 2 version (Cardinal modal)
        //version: '2-bootstrap3-modal',  // v2 3D Secure component using 2-bootstrap3-modal version
        //version: '2-inline-iframe',  // v2 3D Secure component using 2-inline-iframe version
        client: state.btClient 
      }, function(err3, btThreeDS){
        if(err3){ return Playground.logError('braintree.threeDSecure.create error: ', err3); }
        state.btThreeDS = btThreeDS;
        
        // set up listener after instantiation
        state.btThreeDS.on('lookup-complete', function (data, next) {
          // determine if you want to call next to start the challenge,
          Playground.log('3ds lookup-complete event: ', data);

          // inspect the data

          // call next when ready to proceed with the challenge
    
          //some special logic to determine if proceed next()
          if(data){
            //ready to proceed with the challenge
            next();
          }else{
            // if not, call cancelVerifyCard
            Playground.log('3ds lookup-complete => not proceed with next()... ');
            threeDSecure.cancelVerifyCard(function (err, verifyPayload) {
              if (err) {
                // Handle error
                Playground.logError('threeDSecure.cancelVerifyCard error: ', err);
                console.error(err.message); // No verification payload available
                //this is considered a merchant logic cancelling 3ds. So, verify card will have err 

                return;
              }
              Playground.log('threeDSecure.cancelVerifyCard, verifyPayload: ', verifyPayload);
            
              verifyPayload.nonce; // The nonce returned from the 3ds lookup call
              verifyPayload.liabilityShifted; // boolean
              verifyPayload.liabilityShiftPossible; // boolean
            });
          }
        });

        state.btThreeDS.on('customer-canceled', function () {
          Playground.log('3ds customer-canceled event: the customer canceled the 3D Secure challenge');

        });

        state.btThreeDS.on('authentication-iframe-available', function (event, next) {
          Playground.log('3ds authentication-iframe-available event: ', event);

          document.body.appendChild(event.element); // add iframe element to page

          next(); // let the SDK know the iframe is ready
        });

        state.btThreeDS.on('authentication-modal-render', function () {
          Playground.log('3ds authentication-modal-render event: the modal was rendered, presenting the authentication form to the customer');
        });

        state.btThreeDS.on('authentication-modal-close', function () {
          Playground.log('3ds authentication-modal-close event: the modal was closed');

        });

        Playground.log('Ready (with 3DS component initialized)');
      });
    } else {
      Playground.log('Ready (without 3DS component initialized)');
    }
  }

  function mappedGoogleBillingToBTBilling(buyerBillingAddressFromGoogle){
    
    return {
      givenName: 'Steven', // ASCII-printable characters required, else will throw a validation error
      surname: 'Chong', // ASCII-printable characters required, else will throw a validation error
      phoneNumber: buyerBillingAddressFromGoogle?.phoneNumber, //The phone number associated with the billing address. Only numbers; remove dashes, parenthesis and other characters
      streetAddress: buyerBillingAddressFromGoogle?.address1, //this is line 1, max length 50
      extendedAddress: buyerBillingAddressFromGoogle?.address2, // this is line 2, max length 50
      line3: buyerBillingAddressFromGoogle?.address3, // this is line 3, max length 50
      locality: buyerBillingAddressFromGoogle?.locality,
      region: buyerBillingAddressFromGoogle?.administrativeArea, // ISO-3166-2 code
      postalCode: buyerBillingAddressFromGoogle?.postalCode,
      countryCodeAlpha2: buyerBillingAddressFromGoogle?.countryCode
    }

  }

  function onInit(){
    Playground.log('Initializing...');
    Playground.fetchClientToken().then(function(res){
      
      Playground.log('fetchClientToken() API call: ', res);
      if(!res || !res.success && !res.clientToken){
        return;
      }
      var clientToken = res.clientToken || res;
      
      var paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });
      state.googlePaymentClient = paymentsClient;

      braintree.client.create({ authorization: clientToken }, function(err, btClient){
        if(err){ return Playground.logError('bt client creation error:', err); }
        state.btClient = btClient;
        Playground.log('bt client successfully created:');

        //setup device data collector early. 


        braintree.googlePayment.create({ client: btClient, 
          googlePayVersion: 2
          // googleMerchantId: 'your-merchant-id-from-google' not needed in sandbox
        }, function(err2, btGPInstance){
          if(err2){ return Playground.logError('btGPInstance creation error: ', err2); }
          state.btGPInstance = btGPInstance;
          Playground.log('btGPInstance successfully created:');
          var allowedPaymentMethod = btGPInstance.createPaymentDataRequest().allowedPaymentMethods;
          var isReadyOptions = {
            // see https://developers.google.com/pay/api/web/reference/object#IsReadyToPayRequest for all options
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: allowedPaymentMethod,
            existingPaymentMethodRequired: true
          };

          Playground.log('google pay isReadyToPay options: ', isReadyOptions);
          
          paymentsClient.isReadyToPay(isReadyOptions).then(function (isReadyToPay) {
            Playground.log('isReadyToPay result: ', isReadyToPay);
            if (isReadyToPay.result) {
              setupGooglePayButton();
              setupDeviceDataCollector();
              setupThreeDS();
            }
          }).catch(function(err){
            Playground.logError('error log: ', err);
          });;
        });
      });
    });
  }

  function onPay(event){
    event.preventDefault();
    const config = readConfig();
    //var authMethods = Array.prototype.slice.call(document.querySelectorAll('.authMethod:checked')).map(function(x){return x.value;});
    Playground.log('Preparing paymentDataRequest...');

    var paymentDataRequest = state.btGPInstance.createPaymentDataRequest({
      transactionInfo: { 
        totalPriceStatus: 'FINAL', 
        totalPrice: String(config.amount), 
        currencyCode: config.currency 
      }
      //cardRequirements: { billingAddressRequired: billingRequired },
      //allowedPaymentMethods: ['CARD', 'TOKENIZED_CARD'], //currently google only support card
      //cardPaymentMethod: { tokenizationSpecification: { type: 'PAYMENT_GATEWAY' } }
    });

    //paymentDataRequest.allowedCardNetworks = ['VISA','MASTERCARD','AMEX','DISCOVER','JCB'];
    //paymentDataRequest.allowedAuthMethods = authMethods.length ? authMethods : ['PAN_ONLY','CRYPTOGRAM_3DS']; 
    paymentDataRequest.transactionInfo.countryCode = config.countryCode; //required for EEA countries. 

    // We recommend collecting billing address information, at minimum
    // billing postal code, and passing that billing postal code with all
    // Google Pay card transactions as a best practice.
    // See all available options at https://developers.google.com/pay/api/web/reference/object

    Playground.log(`Checking... isBillingRequired: ${config.isBillingRequired}`);
    if(config.isBillingRequired){
      var cardPaymentMethod = paymentDataRequest.allowedPaymentMethods[0];
      cardPaymentMethod.parameters.billingAddressRequired = true;
      cardPaymentMethod.parameters.billingAddressParameters = {
        format: 'FULL',
        phoneNumberRequired: true
      };
    }
    Playground.log('prepared paymentDataRequest: ', paymentDataRequest);

    //var paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });
    state.googlePaymentClient.loadPaymentData(paymentDataRequest).then(function(paymentData){
      Playground.log("after loadPaymentData, paymentData: ", paymentData);
      //if billing address is required, google will return the billing address
      buyerBillingAddressFromGoogle = paymentData?.paymentMethodData?.info?.billingAddress || null;;

      return state.btGPInstance.parseResponse(paymentData);
    }).then(function(payload){
      Playground.log("after btGPInstance.parseResponse, payload: ", payload);
      
      var nonce = payload.nonce;
      var verifyPromise = Promise.resolve({ nonce: nonce });
      Playground.log('This is the nonce before 3ds: ', nonce);
      
      //processing 3DS
      Playground.log(`Checking... enable3ds: ${config.isThreeDS}, isNetworkTokenized(true=no 3ds possible=android): ${payload.details.isNetworkTokenized}`);
      if(config.isThreeDS && state.btThreeDS && !payload.details.isNetworkTokenized){
        //need to check if network tokenized
        Playground.log(`testing`);
        
        verifyPromise = new Promise(function(resolve, reject){
          Playground.log('buyerBillingAddressFromGoogle: ', buyerBillingAddressFromGoogle);
          
          var threeDSecureParameters = {
            amount: String(config.amount),
            nonce: payload.nonce,
            bin: payload.details.bin,
            email: 'test@example.com',
            collectDeviceData: config.isDeviceDataRequired, //this is not the same as the device data in general. This is specifically for 3ds.
            //cardAddChallengeRequested: true, //TODO - allow to be set in config, for card add. not for transaction.
            //challengeRequested: true, //TODO - allow to be set in config
            //dataOnlyRequested: true, //TODO - allow to be set in config
            //requestVisaDAF: true, //TODO - allow to be set in config, WHAT IS THIS? 
            //merchantName: 'override merchant name', //TODO - allow to be set in config
            //customFields: object, //TODO - allow to be set in config. Object where each key is the name of a custom field which has been configured in the Control Panel. In the Control Panel you can configure 3D Secure Rules which trigger on certain values.
            //mobilePhoneNumber: 'some number', //The mobile phone number used for verification. Only numbers; remove dashes, parenthesis and other characters. (maximum length 25)
          
            // additionalInformation: {
            //   authenticationIndicator: "08" // this is specifically for 3RI use case. https://developer.paypal.com/braintree/docs/guides/3d-secure/3ri/javascript/v3/. fro 3RI, It is recommended to perform a challenge during customer-initiated 3DS by passing challengeRequested = true
            // },

            // additionalInformation: {
            //   workPhoneNumber: '8101234567',
            //   shippingGivenName: 'Jill',
            //   shippingSurname: 'Doe',
            //   shippingPhone: '8101234567',
            //   shippingAddress: {
            //     streetAddress: '555 Smith St.',
            //     extendedAddress: '#5',
            //     locality: 'Oakland',
            //     region: 'CA', // ISO-3166-2 code
            //     postalCode: '12345',
            //     countryCodeAlpha2: 'US'
            //   }
            // },
            customFields: {  //useful for 3DS rule manager
              customfield_pass_thru: "customfield_pass_thru 3ds params for verifyCard",
              customfield_storeandpassbackfield: "customfield_storeandpassbackfield 3ds params for verifyCard"
            }
          };

          if(config.isBillingRequired){
            threeDSecureParameters.billingAddress = mappedGoogleBillingToBTBilling(buyerBillingAddressFromGoogle);
          }

          Playground.log('Calling btThreeDS.verifyCard.. ');
          state.btThreeDS.verifyCard(threeDSecureParameters, function(err, result){
            Playground.log('btThreeDS.verifyCard is called');
            if (err) {
              Playground.logError('btThreeDS.verifyCard error:', err);
              if (err.code.indexOf('THREEDS_LOOKUP') === 0) {
                // an error occurred during the initial lookup request
         
                if (err.code === 'THREEDS_LOOKUP_TOKENIZED_CARD_NOT_FOUND_ERROR') {
                  // either the passed payment method nonce does not exist
                  // or it was already consumed before the lookup call was made
                } else if (err.code.indexOf('THREEDS_LOOKUP_VALIDATION') === 0) {
                  // a validation error occurred
                  // likely some non-ascii characters were included in the billing
                  // address given name or surname fields, or the cardholdername field
         
                  // Instruct your user to check their data and try again
                } else {
                  // an unknown lookup error occurred
                }
              } else {
                // some other kind of error
                if (verifyError.code === 'THREEDS_VERIFY_CARD_CANCELED_BY_MERCHANT ') {
                  // flow was canceled by merchant, 3ds info can be found in the payload for cancelVerifyCard
                }   
                //what else?
              }
              
              reject(err); 
            } 
            else { resolve(result); } 
          });
        }).then(function(res){ 
          Playground.log("btThreeDS.verifyCard, res: ", res);
          Playground.log('This is the 3ds enriched nonce: ', res.nonce);
          //Playground.log(`Checking... 3DS Authentication Status: ${config.isThreeDS}, settle: ${config.isSubmitForSettlement}`);
          Playground.log(`Checking... 3DS Info, status: ${res.threeDSecureInfo.status}, liabilityShifted: ${res.threeDSecureInfo.liabilityShifted}, liabilityShiftPossible: ${res.threeDSecureInfo.liabilityShiftPossible}`);
          

          return { nonce: res.nonce, threeDSecureInfo: res.threeDSecureInfo }; 
        });
      }

      return verifyPromise.then(function(v){
        var deviceData = state.btDeviceDataCollectorInstance.deviceData;
        // return Playground.getJSON('/api/payments/google-pay/transaction', {
        //       method: 'POST',
        //       headers: { 'Content-Type': 'application/json' },
        //       body: JSON.stringify({
        //         paymentMethodNonce: v.nonce,
        //         amount: config.amount,
        //         currency: config.currency,
        //         submitForSettlement: config.isSubmitForSettlement,
        //         deviceData: deviceData,
        //         merchantAccountId: config.maid || null
        //       })
        //     });

        return Playground.getJSON('/api/payments/google-pay/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethodNonce: v.nonce,
            merchantAccountId: config.maid || null
          })
        });


        // var dc = config.isDeviceDataRequired ? new Promise(function(resolve){
        //   //processing data collector
        //   braintree.dataCollector.create({ client: state.btClient, kount: true }, function(err, inst){
        //     deviceData = inst && inst.deviceData;
        //     resolve();
        //   });
        // }) : Promise.resolve();

        // return dc.then(function(){
        //   return Playground.getJSON('/api/payments/google-pay/transaction', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //       paymentMethodNonce: v.nonce,
        //       amount: config.amount,
        //       currency: config.currency,
        //       submitForSettlement: config.isSubmitForSettlement,
        //       deviceData: deviceData,
        //       merchantAccountId: config.maid || null
        //     })
        //   });
        // });
      });
    }).then(function(res){
      Playground.log('log', res);
    }).catch(function(err){
      Playground.logError('error log: ', err);
    });
  }

  document.getElementById('init').addEventListener('click', onInit);
})();


