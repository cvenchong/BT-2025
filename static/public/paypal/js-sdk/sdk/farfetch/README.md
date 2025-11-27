# Farfetch-Style Checkout Configuration Guide

## Overview
This checkout page implements a Farfetch-inspired checkout flow with support for multiple payment methods including PayPal and Pay Later.

## Setup Instructions

### 1. Configure PayPal Credentials

Edit `/static/public/paypal/js-sdk/sdk/farfetch/farfetch.js` and update the `PAYPAL_CONFIG` object with your actual PayPal credentials:

```javascript
const PAYPAL_CONFIG = {
    UK: {
        clientId: 'YOUR_UK_PAYPAL_CLIENT_ID',      // Replace with UK sandbox/live client ID
        currency: 'GBP',
        merchantAccountId: 'YOUR_UK_MERCHANT_ACCOUNT_ID'
    },
    US: {
        clientId: 'YOUR_US_PAYPAL_CLIENT_ID',      // Replace with US sandbox/live client ID
        currency: 'USD',
        merchantAccountId: 'YOUR_US_MERCHANT_ACCOUNT_ID'
    }
};
```

### 2. Access the Checkout Page

Once configured, visit: `http://localhost:5000/checkout/farfetch`

## User Flow

### Step 1: Delivery Address Selection
- Two pre-configured addresses are available: UK and US
- Click "Edit" to view and select a different address
- The selected country determines which PayPal merchant account will be used
- Currency automatically updates based on the selected country (GBP for UK, USD for US)

### Step 2: Delivery Method
- Delivery is always free in this demo
- Shows estimated delivery window (Nov 7 - Nov 12)

### Step 3: Payment Method Selection
Choose from three payment methods:
1. **Debit or Credit Card** - Standard card payment
2. **PayPal** - PayPal Smart Payment Buttons
3. **Pay Later** - PayPal Pay Later with messaging

### Step 4: Confirm Payment Method
- Click "Confirm Payment Method" to lock in your selection
- The "Place Order" button becomes enabled

### Step 5: Complete Purchase
- **For Card Payment**: Click "Place Order" button
- **For PayPal**: The Place Order button is replaced with PayPal Smart Payment Button
- **For Pay Later**: PayPal button appears with Pay Later branding and messaging

## Key Features

### Dynamic PayPal SDK Loading
- PayPal SDK is loaded dynamically based on the selected country
- Different client IDs are used for UK vs US transactions
- SDK is reloaded if the user changes the delivery address after confirming PayPal

### Pay Later Messaging
- Automatically displays when Pay Later is selected
- Shows promotional messaging about payment options
- Only available for US addresses (as per PayPal guidelines)

### Address Change Handling
- If user changes address after confirming PayPal, they must reconfirm
- Ensures the correct merchant account is used for the transaction
- PayPal SDK is reinitialized with the new country's credentials

## Implementation Details

### File Structure
```
templates/public/paypal/js-sdk/sdk/farfetch/
  └── farfetch.html                 # Main checkout page

static/public/paypal/js-sdk/sdk/farfetch/
  ├── farfetch.js                   # Checkout logic and PayPal integration
  └── farfetch.css                  # Styling to match Farfetch design
```

### PayPal Integration References
- **Standard Checkout**: https://developer.paypal.com/studio/checkout/standard/integrate
- **Standalone Buttons**: https://developer.paypal.com/docs/checkout/standard/customize/standalone-buttons/
- **Pay Later Integration**: https://developer.paypal.com/studio/checkout/pay-later/us/integrate

## State Management

The checkout maintains state for:
- Selected delivery address and country
- Selected payment method
- Payment method confirmation status
- PayPal SDK loaded status
- Order amount and currency

## Customization

### Adding More Countries
To add support for additional countries:

1. Add country config in `checkout.js`:
```javascript
const PAYPAL_CONFIG = {
    // ... existing configs
    DE: {
        clientId: 'YOUR_GERMANY_CLIENT_ID',
        currency: 'EUR',
        merchantAccountId: 'YOUR_GERMANY_MERCHANT_ACCOUNT_ID'
    }
};
```

2. Add address option in `farfetch.html`:
```html
<div class="address-option" data-country="DE">
    <label>
        <input type="radio" name="address" value="de">
        <div class="address-details">
            <!-- German address details -->
        </div>
    </label>
</div>
```

### Modifying Order Amount
Update the `amount` in the `checkoutState` object in `farfetch.js`:
```javascript
let checkoutState = {
    // ...
    amount: '5051.00'  // Change this value
};
```

## Testing

### Test with PayPal Sandbox
1. Use PayPal Sandbox credentials for testing
2. Test buyer accounts: https://developer.paypal.com/dashboard/accounts
3. Test different scenarios:
   - Change address before confirming payment
   - Change address after confirming PayPal
   - Complete PayPal payment flow
   - Cancel PayPal payment

### Browser Console
Monitor the browser console for:
- PayPal SDK loading status
- Order creation logs
- Payment completion details
- Any errors during the flow

## Notes

- The current implementation uses client-side PayPal integration
- In production, you should verify transactions on your server
- Card payment is a placeholder - implement actual card processing separately
- Pay Later is primarily available in the US market
- Ensure you comply with PayPal's terms of service and regional regulations

## Troubleshooting

### PayPal Button Not Appearing
- Check that client ID is correctly configured
- Verify PayPal SDK loaded successfully in browser console
- Ensure payment method is confirmed

### Address Change Not Working
- Verify `data-country` attribute matches keys in `PAYPAL_CONFIG`
- Check browser console for errors

### Currency Not Updating
- Ensure `updateCurrencyDisplay()` is called after address change
- Verify currency codes in `PAYPAL_CONFIG`
