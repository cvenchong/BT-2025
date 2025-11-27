// @ts-nocheck
/**
 * Farfetch-style Checkout Page
 * Flow:
 * 1. User selects delivery address (determines which PayPal merchant account/client ID to use)
 * 2. User confirms delivery method (always free in this demo)
 * 3. User selects payment method (Card, PayPal, or Pay Later)
 * 4. Once payment method is confirmed, "Place Order" button becomes clickable
 * 5. If PayPal is selected, the Place Order button is replaced with PayPal Smart Payment Button
 */

// Configuration for different countries
const PAYPAL_CONFIG = {
    PT: {
        clientId: 'AYBAxNLRTthLkDdk6IwQHTRr-Df4NAf1Nm5hBE-7yZWkVit7H8_tL8XJ2IXy9dh7NYm7wLErLHtBcywO', // rcvr-pt-1@gmail.com , 
        secret: 'EMb349cjiOikq0JjlhD3AQgab7fDjuyK8rPe3UXlNmb5ezLp35uxeJnSLrQgfhB1I49Iq75MZVrWxJsm',
        currency: 'EUR',
        merchantAccountId: '6GGCGQLWNMWHQ'
    },
    US: {
        clientId: 'AU9ntdGqTcs2jyZFOvBnl6-QOpN0dne_CHwTVoEqa129YZrGgT-bYe20POAEyF8d8ZnoiTABAcAG6iCm', // rcvr-us-1@gmail.com
        secret: 'ED4xahC3yhqdyjoEA5IR7wUWxsQDV8-e2jGQ6ikEil2x8rPQnFNpA5MJLBwRV7IkloNpkCiihIOcaSYe',
        currency: 'USD',
        merchantAccountId: 'HE59SQJTJFXUJ'
    }
};

// State management
let checkoutState = {
    selectedAddress: 'pt',
    selectedCountry: 'PT',
    selectedPaymentMethod: null,
    paymentMethodConfirmed: false,
    paypalSDKLoaded: false,
    currentPayPalScript: null,
    amount: '5051.00',
    vaultPayPal: true,  // Default to checked
    shippingAddress: {
        name: 'Steven Chong',
        addressLine1: 'Rua Augusta, 123',
        addressLine2: '',
        city: 'Lisboa',
        state: '',
        postalCode: '1100-048',
        countryCode: 'PT'
    },
    sdkIntent: 'authorize',
    orderIntent: 'AUTHORIZE',
    buyerEmail: 'steven.chong@example.com',
    buyerCountry: 'PT'  // Buyer country matches delivery address country
};

// DOM Elements
const editAddressBtn = document.getElementById('editAddressBtn');
const addressDisplay = document.getElementById('addressDisplay');
const addressSelection = document.getElementById('addressSelection');
const confirmAddressBtn = document.getElementById('confirmAddressBtn');
const addressRadios = document.querySelectorAll('input[name="address"]');
const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const paypalButtonContainer = document.getElementById('paypalButtonContainer');
const payLaterMessaging = document.getElementById('payLaterMessaging');
const paypalVaultOption = document.getElementById('paypalVaultOption');
const vaultPayPalCheckbox = document.getElementById('vaultPayPalCheckbox');
const totalAmount = document.getElementById('totalAmount');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    // Set initial payment method availability based on default country
    updatePaymentMethodAvailability();
});

function initializeEventListeners() {
    // Address editing
    editAddressBtn.addEventListener('click', showAddressSelection);
    confirmAddressBtn.addEventListener('click', confirmAddressSelection);
    addressRadios.forEach(radio => {
        radio.addEventListener('change', handleAddressChange);
    });

    // Payment method selection
    paymentMethodBtns.forEach(btn => {
        btn.addEventListener('click', () => selectPaymentMethod(btn.dataset.method));
    });

    // Confirm payment method
    confirmPaymentBtn.addEventListener('click', confirmPaymentMethod);

    // Place order (for card payment)
    placeOrderBtn.addEventListener('click', placeOrder);
    
    // PayPal vault checkbox
    if (vaultPayPalCheckbox) {
        vaultPayPalCheckbox.addEventListener('change', (e) => {
            checkoutState.vaultPayPal = e.target.checked;
            console.log('Vault PayPal:', checkoutState.vaultPayPal);
        });
    }
}

// Address Management
function showAddressSelection() {
    addressDisplay.classList.add('hidden');
    addressSelection.classList.remove('hidden');
}

function handleAddressChange(e) {
    const selectedOption = e.target.closest('.address-option');
    checkoutState.selectedCountry = selectedOption.dataset.country;
    
    // Update shipping address from data attributes
    checkoutState.shippingAddress = {
        name: selectedOption.dataset.name,
        addressLine1: selectedOption.dataset.addressLine1,
        addressLine2: selectedOption.dataset.addressLine2,
        city: selectedOption.dataset.city,
        state: selectedOption.dataset.state,
        postalCode: selectedOption.dataset.postalCode,
        countryCode: selectedOption.dataset.countryCode
    };
    
    // Update buyer country to match delivery address country
    checkoutState.buyerCountry = selectedOption.dataset.countryCode;
    
    // Update payment method availability immediately when address changes
    updatePaymentMethodAvailability();
    
    // If PayPal is already confirmed and loaded, we need to reinitialize
    if (checkoutState.paymentMethodConfirmed && checkoutState.selectedPaymentMethod === 'paypal') {
        // Show a message that PayPal needs to be reconfirmed
        alert('Delivery address changed. Please reconfirm your payment method.');
        resetPaymentMethod();
    }
}

function confirmAddressSelection() {
    const selectedRadio = document.querySelector('input[name="address"]:checked');
    checkoutState.selectedAddress = selectedRadio.value;
    
    // Update display
    const selectedOption = selectedRadio.closest('.address-option');
    const addressDetails = selectedOption.querySelector('.address-details').innerHTML;
    addressDisplay.innerHTML = addressDetails;
    
    // Update shipping address from data attributes
    checkoutState.shippingAddress = {
        name: selectedOption.dataset.name,
        addressLine1: selectedOption.dataset.addressLine1,
        addressLine2: selectedOption.dataset.addressLine2,
        city: selectedOption.dataset.city,
        state: selectedOption.dataset.state,
        postalCode: selectedOption.dataset.postalCode,
        countryCode: selectedOption.dataset.countryCode
    };
    
    // Update buyer country to match delivery address country
    checkoutState.buyerCountry = selectedOption.dataset.countryCode;
    
    // Update currency display based on country
    updateCurrencyDisplay();
    
    // Update payment method availability based on country
    updatePaymentMethodAvailability();
    
    // Hide selection, show display
    addressSelection.classList.add('hidden');
    addressDisplay.classList.remove('hidden');
}

function updateCurrencyDisplay() {
    const config = PAYPAL_CONFIG[checkoutState.selectedCountry];
    const currency = config.currency;
    const symbol = currency === 'USD' ? '$' : '£';
    const amount = checkoutState.amount;
    const formattedAmount = `${currency} ${symbol}${formatNumber(amount)}`;
    
    totalAmount.textContent = formattedAmount;
    document.querySelector('.total-price strong').textContent = formattedAmount;
}

function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function updatePaymentMethodAvailability() {
    const payLaterBtn = document.querySelector('[data-method="paylater"]');
    
    // Pay Later is only available for US
    if (checkoutState.selectedCountry === 'US') {
        payLaterBtn.style.display = '';
        payLaterBtn.disabled = false;
    } else {
        payLaterBtn.style.display = 'none';
        
        // If Pay Later was selected, reset the selection
        if (checkoutState.selectedPaymentMethod === 'paylater') {
            payLaterBtn.classList.remove('active');
            checkoutState.selectedPaymentMethod = null;
            confirmPaymentBtn.disabled = true;
            payLaterMessaging.classList.add('hidden');
            
            // If payment was already confirmed, reset it
            if (checkoutState.paymentMethodConfirmed) {
                resetPaymentMethod();
            }
        }
    }
}

// Payment Method Management
function selectPaymentMethod(method) {
    checkoutState.selectedPaymentMethod = method;
    
    // Update UI
    paymentMethodBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    
    // Enable confirm button
    confirmPaymentBtn.disabled = false;
    
    // Show/hide Pay Later messaging
    if (method === 'paylater') {
        payLaterMessaging.classList.remove('hidden');
        paypalVaultOption.classList.add('hidden');
        loadPayLaterMessaging();
    } else if (method === 'paypal') {
        payLaterMessaging.classList.add('hidden');
        paypalVaultOption.classList.remove('hidden');
    } else {
        payLaterMessaging.classList.add('hidden');
        paypalVaultOption.classList.add('hidden');
    }
    
    // Reset confirmation if changing method
    if (checkoutState.paymentMethodConfirmed) {
        resetPaymentMethod();
    }
}

function confirmPaymentMethod() {
    checkoutState.paymentMethodConfirmed = true;
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.textContent = 'Payment Method Confirmed ✓';
    
    // Disable payment method buttons
    paymentMethodBtns.forEach(btn => {
        btn.disabled = true;
    });
    
    // Handle based on payment method
    if (checkoutState.selectedPaymentMethod === 'paypal') {
        showPayPalButton();
    } else if (checkoutState.selectedPaymentMethod === 'paylater') {
        showPayPalButton(true); // Pay Later uses PayPal button with different configuration
    } else {
        // Card payment - enable regular place order button
        placeOrderBtn.disabled = false;
        placeOrderBtn.classList.remove('hidden');
        paypalButtonContainer.classList.add('hidden');
    }
}

function resetPaymentMethod() {
    checkoutState.paymentMethodConfirmed = false;
    confirmPaymentBtn.disabled = false;
    confirmPaymentBtn.textContent = 'Confirm Payment Method';
    
    // Re-enable payment method buttons
    paymentMethodBtns.forEach(btn => {
        btn.disabled = false;
    });
    
    // Hide PayPal button, show regular button
    placeOrderBtn.disabled = true;
    placeOrderBtn.classList.remove('hidden');
    paypalButtonContainer.classList.add('hidden');
    
    // Destroy existing PayPal button if any
    paypalButtonContainer.innerHTML = '';
}

// PayPal Integration
function showPayPalButton(isPayLater = false) {
    // Hide regular place order button
    placeOrderBtn.classList.add('hidden');
    
    // Show PayPal container
    paypalButtonContainer.classList.remove('hidden');
    
    // Load PayPal SDK if not already loaded for this country
    loadPayPalSDK(isPayLater);
}

function loadPayPalSDK(isPayLater = false) {
    const config = PAYPAL_CONFIG[checkoutState.selectedCountry];
    
    // Remove existing PayPal script if any
    if (checkoutState.currentPayPalScript) {
        checkoutState.currentPayPalScript.remove();
        checkoutState.paypalSDKLoaded = false;
        // Clear any existing PayPal namespace
        if (window.paypal) {
            delete window.paypal;
        }
    }
    
    // Build SDK URL with required components
    let sdkUrl = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${config.currency}&intent=${checkoutState.sdkIntent}`;
    
    if (isPayLater) {
        sdkUrl += '&components=buttons,messages&enable-funding=paylater';
    } else {
        sdkUrl += '&components=buttons';
    }
    
    // Create and load script
    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;
    script.onload = () => {
        checkoutState.paypalSDKLoaded = true;
        renderPayPalButton(isPayLater);
    };
    script.onerror = () => {
        console.error('Failed to load PayPal SDK');
        alert('Failed to load PayPal. Please try again.');
    };
    
    checkoutState.currentPayPalScript = script;
    document.head.appendChild(script);
}

function renderPayPalButton(isPayLater = false) {
    const config = PAYPAL_CONFIG[checkoutState.selectedCountry];
    
    // Clear container
    paypalButtonContainer.innerHTML = '';
    
    const buttonConfig = {
        style: {
            layout: 'vertical',
            color: isPayLater ? 'gold' : 'blue',
            shape: 'rect',
            label: isPayLater ? 'paylater' : 'paypal',
            height: 50
        },
        
        createOrder: function(data, actions) {
            // Build shipping address object
            const shippingAddress = {
                address_line_1: checkoutState.shippingAddress.addressLine1,
                admin_area_2: checkoutState.shippingAddress.city,
                postal_code: checkoutState.shippingAddress.postalCode,
                country_code: checkoutState.shippingAddress.countryCode
            };
            
            // Add address_line_2 if exists
            if (checkoutState.shippingAddress.addressLine2) {
                shippingAddress.address_line_2 = checkoutState.shippingAddress.addressLine2;
            }
            
            // Add admin_area_1 (state) if exists (required for US)
            if (checkoutState.shippingAddress.state) {
                shippingAddress.admin_area_1 = checkoutState.shippingAddress.state;
            }
            
            const orderPayload = {
                intent: checkoutState.orderIntent,
                purchase_units: [{
                    invoice_id: `INV-${Date.now()}`,
                    amount: {
                        value: checkoutState.amount,
                        currency_code: config.currency
                    },
                    description: 'Lanvin Product Purchase',
                    shipping: {
                        name: {
                            full_name: checkoutState.shippingAddress.name
                        },
                        address: shippingAddress
                    }
                }],
                payment_source: {
                    paypal: {
                        email_address: checkoutState.buyerEmail,
                        experience_context: {
                            shipping_preference: 'SET_PROVIDED_ADDRESS',
                            user_action: 'PAY_NOW',
                            brand_name: 'Farfetch Demo Store',
                            return_url: "https://example.com/returnUrl",
                            cancel_url: "https://example.com/cancelUrl"
                        }
                    }
                }
            };

            // Add vault option if user wants to save PayPal for future use. 
            if (checkoutState.vaultPayPal && !isPayLater) {
                orderPayload.payment_source.paypal.attributes = {
                    vault: {
                        store_in_vault: 'ON_SUCCESS',
                        usage_type: 'MERCHANT',
                        customer_type: 'CONSUMER'
                    }
                };
            }
            console.log('Creating order with payload:', orderPayload);

            console.log('Adding client id and secret to order payload for demo purposes. In production should handle it securely');
            orderPayload.client_id = config.clientId;
            orderPayload.client_secret = config.secret;

            // Create order via backend
            return createOrderViaBackend(orderPayload);
        },
        
        onApprove: function(data, actions) {
            console.log('Order approved:', data);
            console.log('Adding client id and secret to order payload for demo purposes. In production should handle it securely');
            data.client_id = config.clientId;
            data.client_secret = config.secret;

            return authorizeOrder(data).then(function(details) {
                console.log('Transaction completed by ' + details.payer.name.given_name);
                console.log('Full payment details:', details);
                
                // Check if PayPal was vaulted
                if (details.payment_source && details.payment_source.paypal && details.payment_source.paypal.attributes) {
                    const vaultData = details.payment_source.paypal.attributes.vault;
                    if (vaultData && vaultData.id) {
                        console.log('PayPal vaulted successfully! Vault ID:', vaultData.id);
                        details.vaulted = true;
                        details.vaultId = vaultData.id;
                    }
                }
                
                // Handle successful payment
                handleSuccessfulPayment(details);
            });
        },
        
        onError: function(err) {
            console.error('PayPal Error:', err);
            alert('An error occurred with PayPal. Please try again.');
        },
        
        onCancel: function(data) {
            console.log('PayPal payment cancelled', data);
            alert('Payment was cancelled.');
        }
    };
    
    // Add funding source for Pay Later
    if (isPayLater) {
        buttonConfig.fundingSource = window.paypal.FUNDING.PAYLATER;
    }
    
    window.paypal.Buttons(buttonConfig).render('#paypalButtonContainer');
}

function loadPayLaterMessaging() {
    const config = PAYPAL_CONFIG[checkoutState.selectedCountry];
    
    // Only load for US (Pay Later is primarily US-focused)
    if (checkoutState.selectedCountry !== 'US') {
        payLaterMessaging.innerHTML = '<p class="info-text">Pay Later is available for US addresses only.</p>';
        return;
    }
    
    // Load PayPal SDK with messaging component if not already loaded
    if (!checkoutState.paypalSDKLoaded) {
        const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${config.currency}&components=messages`;
        
        const script = document.createElement('script');
        script.src = sdkUrl;
        script.async = true;
        script.onload = () => {
            checkoutState.paypalSDKLoaded = true;
        };
        
        document.head.appendChild(script);
    }
}

//Authorize Order
async function authorizeOrder(orderPayload) {
    try {
        const response = await fetch('/authorize_pp_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Order authorized on backend:', data);
        return data.order_response;
    } catch (error) {
        console.error('Error authorizing order:', error);
        throw error;
    }
}

// Order Creation
async function createOrderViaBackend(orderPayload) {
    try {
        const response = await fetch('/create_pp_order_v2_raw_payload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Order created on backend:', data);

        // Return the order ID from PayPal
        if (data.order_response.id) {
            return data.order_response.id;
        } else {
            throw new Error('No order ID returned from backend');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

// Order Placement
function placeOrder() {
    if (!checkoutState.paymentMethodConfirmed) {
        alert('Please confirm your payment method first.');
        return;
    }
    
    // Disable button to prevent double-click
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Processing...';
    
    // Simulate order processing
    setTimeout(() => {
        // Here you would normally send the order to your backend
        console.log('Order placed:', {
            address: checkoutState.selectedAddress,
            country: checkoutState.selectedCountry,
            paymentMethod: checkoutState.selectedPaymentMethod,
            amount: checkoutState.amount
        });
        
        alert('Order placed successfully! (Card Payment)');
        
        // Reset button
        placeOrderBtn.textContent = 'Place Order';
    }, 1500);
}

function handleSuccessfulPayment(details) {
    console.log('Payment successful:', details);
    
    // Send to backend for verification
    // In a real implementation, you would:
    // 1. Send the order ID to your backend
    // 2. Verify the payment on the server side
    // 3. Create the order in your system
    // 4. If vaulted, save the vault ID for future use
    // 5. Redirect to confirmation page
    
    let message = `Payment successful! Transaction ID: ${details.id}`;
    
    if (details.vaulted && details.vaultId) {
        message += `\n\nPayPal saved for future purchases!\nVault ID: ${details.vaultId}`;
    }
    
    //alert(message);
    
    // Redirect to success page (implement this based on your routing)
    // window.location.href = '/order-confirmation?id=' + details.id;
}

// Utility: Show/hide elements
function addClass(element, className) {
    if (element) element.classList.add(className);
}

function removeClass(element, className) {
    if (element) element.classList.remove(className);
}

function toggleClass(element, className) {
    if (element) element.classList.toggle(className);
}
