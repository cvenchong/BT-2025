(function () {
	const $id = (id) => document.getElementById(id);
	const consoleEl = $id('console');
	const initBtn = $id('init-dropin');
	const teardownBtn = $id('teardown-dropin');
	const requestBtn = $id('request-payment');
	const dropinContainer = $id('dropin-container');
	const listPaymentOptionsBtn = $id('list-payment-options');

	let dropinInstance = null;
	let currentClientToken = null;

	let handlers = {
		changeActiveView: null,
		paymentMethodRequestable: null,
		noPaymentMethodRequestable: null,
		paymentOptionSelected: null,
		'card:binAvailable': null,
		'card:blur': null,
		'card:cardTypeChange': null,
		'card:empty': null,
		'card:focus': null,
		'card:inputSubmitRequest': null,
		'card:notEmpty': null,
		'card:validityChange': null,
		'3ds:customer-canceled': null,
		'3ds:authentication-modal-render': null,
		'3ds:authentication-modal-close': null
	};

	function log(message, data) {
		const time = new Date().toISOString();
		let line = `[${time}] ${message}`;
		if (data !== undefined) {
			line += `\n${JSON.stringify(data, null, 2)}`;
		}
		consoleEl.textContent += (consoleEl.textContent ? '\n' : '') + line;
		consoleEl.scrollTop = consoleEl.scrollHeight;
		console.log(line); //cursor, please do not remove this line.
	}

	async function fetchClientTokenAndPMTs(customerId) {
		const payload = { custId: customerId };
		const res = await fetch('/createCTAndFetchPMTs', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!res.ok) throw new Error('Failed to fetch client token');
		const json = await res.json();
		if (!json.success) throw new Error('Server returned unsuccessful response');
		return json;
	}

	function readConfig() {
		return {
			customerId: $id('customer-id').value.trim() || null,
			amount: $id('amount').value,
			serverVaultOnSuccess: $id('server-vault-on-success').checked,
			clientVaultCard: $id('client-vault-card').checked,
			vaultManager: $id('vault-manager').checked,
			deviceDataCollector: $id('device-data-collector').checked,
			card: $id('enable-card').checked,
			threeDS: $id('enable-3ds').checked,
			cardholderRequired: $id('cardholder-required').value === 'true',
			paypal: $id('enable-paypal').checked,
			paypalFlow: $id('paypal-flow').value,
			googlePay: $id('enable-google-pay').checked,
			gpayEnv: $id('gpay-env').value,
			applePay: $id('enable-apple-pay').checked,
			appleMerchantId: $id('apple-merchant-id').value.trim(),
			venmo: $id('enable-venmo').checked,
			// events
			evt_changeActiveView: $id('evt-changeActiveView').checked,
			evt_paymentMethodRequestable: $id('evt-paymentMethodRequestable').checked,
			evt_noPaymentMethodRequestable: $id('evt-noPaymentMethodRequestable').checked,
			evt_paymentOptionSelected: $id('evt-paymentOptionSelected').checked,
			evt_card_binAvailable: $id('evt-card:binAvailable').checked,
			evt_card_blur: $id('evt-card:blur').checked,
			evt_card_cardTypeChange: $id('evt-card:cardTypeChange').checked,
			evt_card_empty: $id('evt-card:empty').checked,
			evt_card_focus: $id('evt-card:focus').checked,
			evt_card_inputSubmitRequest: $id('evt-card:inputSubmitRequest').checked,
			evt_card_notEmpty: $id('evt-card:notEmpty').checked,
			evt_card_validityChange: $id('evt-card:validityChange').checked,
			evt_3ds_customer_canceled: $id('evt-3ds:customer-canceled').checked,
			evt_3ds_auth_modal_render: $id('evt-3ds:authentication-modal-render').checked,
			evt_3ds_auth_modal_close: $id('evt-3ds:authentication-modal-close').checked
		};
	}

	function buildCreateOptions(config) {
		const options = {
			authorization: currentClientToken,
			container: '#dropin-container'
		};

		//TODO - disable cardholder name input

		//options.preselectVaultedPaymentMethod = false;
		//TODO - how to make it such that always one-time payment being selected first? 

		//change the option arrangement
		options.paymentOptionPriority = [ 'card', 'paypal', 'paypalCredit', 'venmo', 'applePay', 'googlePay'];

		//to implement data collector https://developer.paypal.com/braintree/docs/guides/premium-fraud-management-tools/client-side/javascript/v3/#drop-in
		options.dataCollector = !!config.deviceDataCollector;

		if (config.vaultManager) {
			options.vaultManager = !!config.vaultManager;
		}

		if (config.card) {
			options.card = {
				//https://braintree.github.io/braintree-web-drop-in/docs/current/module-braintree-web-drop-in.html#~cardCreateOptions
				cardholderName: { required: !!config.cardholderRequired },
				vault: { 
					allowVaultCardOverride: true , //bring out the save card checkbox (this will determine if store in vault or not)
					vaultCard: !!config.clientVaultCard //this can be used to control Whether or not to vault the card **upon tokenization**. = pre-checked the checkout to save 
					//test cases (without 3ds)
					//1 client to vault, server (success auth) not to vault => result: vaulted. 
					//2 client not to vault, server (success auth) not to vault => result: not vaulted
					//3 client to vault, server (failed auth) not to vault => result: **vaulted. This is vault on tokenization!
					//4 client not to vault, server (failed auth) not to vault => result: 

					//repeatedly vault using case 1 (without cardholder name). 
					// Result: 2 payment methods seen in gateway. first created = default. 
					// Dropin shows only 1 (the new one):  
					// 	Pay with the stored card shows that it uses the new one (vault_on_success & vault_on_tokenizationwill not create another pmt. ). 
					// 	Deleting it also remove the new one. (but the UI will then show the old one. User needs to remove twice. How to prevent such things to happen? use changeActiveView + server side to determine? )
					

					//TODO - how to recapture cvv using Dropin? build a custom payment method list with hf cvv only? 
				}

			};
		}

		// 3DS is enabled by providing threeDSecure option, passing true = default 3ds cardinalSDKConfig 
		if (config.threeDS) {
			options.threeDSecure = !!config.threeDS;
		}		
		// if (config.threeDS) {
		// 	options.threeDSecure = {
		// 		cardinalSDKConfig: {
		// //TODO we can also use a non default cardinalSDKConfig by passing object, waht are some use cases?

		// 		}
		// 	}
		// }		

		if (config.paypal) {
			options.paypal = {
				flow: config.paypalFlow === 'vault' ? 'vault' : 'checkout',
				amount: config.paypalFlow === 'checkout' ? config.amount : undefined,
				currency: 'EUR',
				buttonStyle: { color: 'blue', shape: 'rect', size: 'medium' }
			};
		}

		if (config.googlePay) {
			options.googlePay = {
				googlePayVersion: 2,
				merchantId: 'Braintree',
				environment: config.gpayEnv,
				transactionInfo: {
					totalPriceStatus: 'FINAL',
					totalPrice: String(config.amount),
					currencyCode: 'EUR'
				}
			};
		}

		if (config.applePay) {
			options.applePay = {
				merchantIdentifier: config.appleMerchantId || 'merchant.com.example',
				displayName: 'Demo Store',
				paymentRequest: {
					total: { label: 'Demo Store', amount: String(config.amount) },
					currencyCode: 'EUR'
				}
			};
		}

		if (config.venmo) {
			options.venmo = { allowNewBrowserTab: false };
		}

		return options;
	}

	function attachEventHandlers(instance, config) {
		// clean previous if any
		detachEventHandlers(instance);

		// core
		if (config.evt_changeActiveView) {
			handlers.changeActiveView = function (event) { log('Event: changeActiveView', event); };
			instance.on('changeActiveView', handlers.changeActiveView);
		}
		if (config.evt_paymentMethodRequestable) { //control for auto vs manual flow
			/* Another common use case is to automatically retrieve the payment method nonce as soon as it is available.
			For payment methods that have an external flow (e.g. PayPal, Venmo, Apple Pay, Google Pay, etc.), paymentMethodRequestable fires as soon as the flow is completed. 
			For form based payment methods (e.g. credit cards), paymentMethodRequestable fires when all fields pass client side validation, but the customer may not be ready to submit the form. 
			To assist with this, paymentMethodRequestable includes an event object with a paymentMethodIsSelected property. 
			This will be true when the payment method is presented as selected (such as when finishing an external flow) and false when it is not. */
			handlers.paymentMethodRequestable = function (event) {
				log('Event: paymentMethodRequestable', event);
				requestBtn.disabled = false;
				//if (!event.paymentMethodIsSelected) { 
					// this applicable to form based payment methods (e.g. card) & payment method is presented + selected (event.paymentMethodIsSelected = true) 
					// but if needed to "auto submit" once validation passed, enabled below. 
					//	requestPaymentMethod(); 
				if(event.type==='CreditCard'){
					// there is no need to send to server again as it has already wired to requestBtn click event.
					log('Event Type: paymentMethodRequestable', event.type);
				}else{
					// this applicable to external payment methods (e.g. PayPal, Venmo, Apple Pay, Google Pay)
					requestPaymentMethod();
				}
			};
			instance.on('paymentMethodRequestable', handlers.paymentMethodRequestable);
		}
		if (config.evt_noPaymentMethodRequestable) {
			handlers.noPaymentMethodRequestable = function () { 
				log('Event: noPaymentMethodRequestable'); 
				requestBtn.disabled = true;
			};
			instance.on('noPaymentMethodRequestable', handlers.noPaymentMethodRequestable);
		}
		if (config.evt_paymentOptionSelected) {
			handlers.paymentOptionSelected = function (event) { log('Event: paymentOptionSelected', event); };
			instance.on('paymentOptionSelected', handlers.paymentOptionSelected);
		}

		// card view
		if (config.evt_card_binAvailable) {
			handlers['card:binAvailable'] = function (event) { log('Event: card:binAvailable', event); };
			instance.on('card:binAvailable', handlers['card:binAvailable']);
		}
		if (config.evt_card_blur) {
			handlers['card:blur'] = function (event) { log('Event: card:blur', event); };
			instance.on('card:blur', handlers['card:blur']);
		}
		if (config.evt_card_cardTypeChange) {
			handlers['card:cardTypeChange'] = function (event) { log('Event: card:cardTypeChange', event); };
			instance.on('card:cardTypeChange', handlers['card:cardTypeChange']);
		}
		if (config.evt_card_empty) {
			handlers['card:empty'] = function (event) { log('Event: card:empty', event); };
			instance.on('card:empty', handlers['card:empty']);
		}
		if (config.evt_card_focus) {
			handlers['card:focus'] = function (event) { log('Event: card:focus', event); };
			instance.on('card:focus', handlers['card:focus']);
		}
		if (config.evt_card_inputSubmitRequest) {
			handlers['card:inputSubmitRequest'] = function (event) { log('Event: card:inputSubmitRequest', event); };
			instance.on('card:inputSubmitRequest', handlers['card:inputSubmitRequest']);
		}
		if (config.evt_card_notEmpty) {
			handlers['card:notEmpty'] = function (event) { log('Event: card:notEmpty', event); };
			instance.on('card:notEmpty', handlers['card:notEmpty']);
		}
		if (config.evt_card_validityChange) {
			handlers['card:validityChange'] = function (event) { log('Event: card:validityChange', event); };
			instance.on('card:validityChange', handlers['card:validityChange']);
		}

		// 3DS
		if (config.evt_3ds_customer_canceled) {
			handlers['3ds:customer-canceled'] = function (event) { log('Event: 3ds:customer-canceled', event); };
			instance.on('3ds:customer-canceled', handlers['3ds:customer-canceled']);
		}
		if (config.evt_3ds_auth_modal_render) {
			handlers['3ds:authentication-modal-render'] = function (event) { log('Event: 3ds:authentication-modal-render', event); };
			instance.on('3ds:authentication-modal-render', handlers['3ds:authentication-modal-render']);
		}
		if (config.evt_3ds_auth_modal_close) {
			handlers['3ds:authentication-modal-close'] = function (event) { log('Event: 3ds:authentication-modal-close', event); };
			instance.on('3ds:authentication-modal-close', handlers['3ds:authentication-modal-close']);
		}
	}

	function detachEventHandlers(instance) {
		if (!instance) return;
		Object.keys(handlers).forEach(function (key) {
			if (handlers[key]) {
				instance.off(key, handlers[key]);
				handlers[key] = null;
			}
		});
	}

	async function initialize() {
		if (dropinInstance) { log('Drop-in already initialized.'); return; }
		const config = readConfig();
		try {
			const { clientToken } = await fetchClientTokenAndPMTs(config.customerId || 'guest');
			currentClientToken = clientToken;
			log('Fetched client token');

			const createOptions = buildCreateOptions(config);
			log('Creating Drop-in with options', createOptions);

			braintree.dropin.create(createOptions, function (err, instance) {
				if (err) { log('Error creating Drop-in', { message: err.message }); return; }
				dropinInstance = instance;
				log('Drop-in created');
				attachEventHandlers(dropinInstance, config);
				
				// Enable/disable request button based on payment method availability
				console.log('dropinInstance.isPaymentMethodRequestable()', dropinInstance.isPaymentMethodRequestable());
				if (dropinInstance.isPaymentMethodRequestable()) {
					requestBtn.disabled = false;
				} else {
					requestBtn.disabled = true;
				}
				requestBtn.classList.add('visible');
				
				teardownBtn.disabled = false;
			});
		} catch (e) { log('Initialization failed', { message: e.message }); }
	}

	function teardown() {
		if (!dropinInstance) return;
		dropinInstance.teardown(function (err) {
			if (err) { log('Error tearing down Drop-in', { message: err.message }); return; }
			dropinContainer.innerHTML = '';
			dropinInstance = null;
			log('Drop-in torn down');
			requestBtn.disabled = true;
			teardownBtn.disabled = true;
		});
	}

	function requestPaymentMethod() {
		if (!dropinInstance) return;

		// //TODO 3ds verification options
		const config = readConfig(); 
		var threeDSOptions={};
		if(!!config.threeDS){
			threeDSOptions.threeDSecure = {
				amount: String(config.amount),
				//amount: String(config.amount),
				merchantName: 'CanOverrideMerchantName', //no way to override maid, it will follow the client token. if client token creation did not specify MAID, it will be treated as default maid. If txn.sale provides another maid, it will fail with "Error Code: 91584, Error Message: Merchant account must match the 3D Secure authorization merchant account.". 
				email: 'test@example.com',
				//this is the billing address for 3ds only. Transaction.sale needs to be passed as well. 
				billingAddress: {
				  givenName: 'Jill', // ASCII-printable characters required, else will throw a validation error
				  surname: 'Doe', // ASCII-printable characters required, else will throw a validation error
				  phoneNumber: '8101234567',
				  streetAddress: '555 Smith St.',
				  extendedAddress: '#5',
				  locality: 'Oakland',
				  region: 'CA', // ISO-3166-2 code
				  postalCode: '12345',
				  countryCodeAlpha2: 'US'
				},
				collectDeviceData: true,
				additionalInformation: {
				  workPhoneNumber: '8101234567',
				  shippingGivenName: 'Jill',
				  shippingSurname: 'Doe',
				  shippingPhone: '8101234567',
				  shippingAddress: {
					streetAddress: '555 Smith St.',
					extendedAddress: '#5',
					locality: 'Oakland',
					region: 'CA', // ISO-3166-2 code
					postalCode: '12345',
					countryCodeAlpha2: 'US'
				  }
				},
			  };
		}
		log("3dReqOpt:", threeDSOptions);

		dropinInstance.requestPaymentMethod(threeDSOptions, function (err, payload) {
			if (err) { log('requestPaymentMethod error', { message: err.message }); 
			console.error(err);
			return; }
			log('requestPaymentMethod returned payload', payload); //this will include deviceData info
			if(payload.type === "CreditCard"){
				//we can check liability shift here. before proceeding further. or do at server side
			}

			submitNonceToBackend(payload);
		});
	}
	

	async function submitNonceToBackend(payload) {
		const config = readConfig();
		endpoint = config.amount === '0.00'? '/createPMT': '/createPayment';
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				payment_method_nonce: payload.nonce,
				device_data: payload.deviceData || undefined,
				amount: config.amount,
				customerId: config.customerId || undefined,
				serverVaultOnSuccess: config.serverVaultOnSuccess || false
			})
		});
		const json = await res.json();
		if (json.success) {
			log('Transaction success', json);
			// log('Tearing down drop-in after successful payment');
			// teardown();
			window.open(
				`https://sandbox.braintreegateway.com/merchants/9dxqqftdw4x6jfbr/transactions/${json.transaction_id}`,
				"_blank"
			);
		} else {
			log('Transaction failed', json);
			if (dropinInstance && dropinInstance.clearSelectedPaymentMethod) { dropinInstance.clearSelectedPaymentMethod(); }
		}
	}

	initBtn.addEventListener('click', initialize);
	teardownBtn.addEventListener('click', teardown);
	requestBtn.addEventListener('click', requestPaymentMethod);
	listPaymentOptionsBtn.addEventListener('click', function () {
		if (!dropinInstance) return;
		const options = dropinInstance.getAvailablePaymentOptions ? dropinInstance.getAvailablePaymentOptions() : [];
		log('Available payment options', options);
	});
})(); 