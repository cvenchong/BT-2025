import { BraintreePayPalButtons } from "@paypal/react-paypal-js";

const BASE_URL = "http://localhost:8888";

const BraintreeButtons = () => {
  return (
    <>
      <BraintreePayPalButtons
        fundingSource="paypal"
        createOrder={async (_data, actions) => {
          return actions.braintree
            .createPayment({
              flow: "checkout",
              amount: "10.00",
              currency: "GBP",
              intent: "capture",
            })
            .then((orderId) => {
              if (!orderId) {
                throw new Error("No order ID with associated created order");
              }

              console.log(`Order with ID ${orderId} successfully created`);
              return orderId;
            })
            .catch(() => {
              return undefined;
            });
        }}
        onApprove={async (data, actions) => {
          return actions.braintree
            .tokenizePayment({
              payerID: data.payerID,
              paymentID: data.paymentID,
              vault: false,
            })
            .then((payload) => {
              if (!payload.nonce) {
                throw new Error("No nonce received");
              }

              return payload.nonce;
            })
            .then((nonce) => {
              console.log(`Successfully received payment nonce: ${nonce}`);

              console.log("Creating transaction");
              return fetch(`${BASE_URL}/braintree/sdk/transaction/new`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  amount: "10.00",
                  paymentMethodNonce: nonce,
                  storeInVaultOnSuccess: false,
                  submitForSettlement: true,
                }),
              });
            })
            .then(async (response) => {
              if (response.status === 201) {
                return response.json();
              } else {
                throw new Error((await response.json())?.message);
              }
            })
            .then((data) => {
              if (!data.transactionId) {
                throw new Error(
                  "No transaction ID with associated successful transaction"
                );
              }

              return data.transactionId;
            })
            .then((transactionId) => {
              console.log(
                `Order with ID ${data.orderID} and transaction with ID ${transactionId} successfully created and settled`
              );
            })
            .catch((error) => {
              console.error(error);
            });
        }}
      />
      <BraintreePayPalButtons
        fundingSource="paylater"
        style={{
          color: "gold",
        }}
        createOrder={async (_data, actions) => {
          return actions.braintree
            .createPayment({
              flow: "checkout",
              amount: "10.00",
              currency: "GBP",
              intent: "capture",
            })
            .then((orderId) => {
              if (!orderId) {
                throw new Error("No order ID with associated created order");
              }

              console.log(`Order with ID ${orderId} successfully created`);
              return orderId;
            })
            .catch(() => {
              return undefined;
            });
        }}
        onApprove={async (data, actions) => {
          return actions.braintree
            .tokenizePayment({
              payerID: data.payerID,
              paymentID: data.paymentID,
              vault: false,
            })
            .then((payload) => {
              if (!payload.nonce) {
                throw new Error("No nonce received");
              }

              return payload.nonce;
            })
            .then((nonce) => {
              console.log(`Successfully received payment nonce: ${nonce}`);

              console.log("Creating transaction");
              return fetch(`${BASE_URL}/braintree/sdk/transaction/new`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  amount: "10.00",
                  paymentMethodNonce: nonce,
                  storeInVaultOnSuccess: false,
                  submitForSettlement: true,
                }),
              });
            })
            .then(async (response) => {
              if (response.status === 201) {
                return response.json();
              } else {
                throw new Error((await response.json())?.message);
              }
            })
            .then((data) => {
              if (!data.transactionId) {
                throw new Error(
                  "No transaction ID with associated successful transaction"
                );
              }

              return data.transactionId;
            })
            .then((transactionId) => {
              console.log(
                `Order with ID ${data.orderID} and transaction with ID ${transactionId} successfully created and settled`
              );
            })
            .catch((error) => {
              console.error(error);
            });
        }}
      />
    </>
  );
};

export default BraintreeButtons;
