const BASE_URL = "http://localhost:8888";

function main() {
  // eslint-disable-next-line no-undef
  if ((paypal ?? null) === null) {
    console.error("No paypal object with associated loaded PayPal script");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No paypal object with associated loaded PayPal script";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((paypal.Buttons ?? null) === null) {
    console.error("No Buttons method with associated paypal object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No Buttons method with associated paypal object";
    return;
  }

  // eslint-disable-next-line no-undef
  paypal
    .Buttons({
      async createOrder() {
        console.log("Received order creation request");

        const purchaseUnits = [
          {
            reference_id: "asdf",
            description: "qwerty",
            amount: {
              currency_code: "GBP",
              value: "78.50",
            },
            invoice_id: crypto.randomUUID(),
          },
        ];

        console.log("Attempting to create order");
        return fetch(`${BASE_URL}/paypal/rest/order/new`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchaseUnits: purchaseUnits,
            paymentSource: {
              paypal: {
                experience_context: {
                  // TODO: play around with
                  return_url:
                    "http://localhost:5500/public/JS-SDK/vault-purchase-paypal/index.html",
                  // TODO: play around with
                  cancel_url:
                    "http://localhost:5500/public/JS-SDK/vault-purchase-paypal/index.html",
                  // TODO: play around with
                  shipping_preference: "NO_SHIPPING",
                },
                attributes: {
                  vault: {
                    store_in_vault: "ON_SUCCESS",
                    usage_type: "MERCHANT",
                    customer_type: "CONSUMER",
                    permit_multiple_payment_tokens: true,
                  },
                },
              },
            },
          }),
        })
          .then(async (response) => {
            if (response.status === 201) {
              return response.json();
            } else {
              throw new Error((await response.json())?.message);
            }
          })
          .then((data) => {
            if ((data?.id ?? null) === null) {
              throw new Error("No order ID with associated created order");
            }

            return data.id;
          })
          .then((orderId) => {
            console.log(`Order with ID ${orderId} successfully created`);
            document.getElementById(
              "feedback"
            ).innerHTML = `Order with ID ${orderId} successfully created`;
            document.getElementById("error").innerHTML = "";
            return orderId;
          })
          .catch(() => {
            document.getElementById("feedback").innerHTML =
              "Error creating order";
            return undefined;
          });
      },
      onApprove(data) {
        if ((data ?? null) === null) {
          document.getElementById("feedback").innerHTML =
            "Error approving order";
          throw new Error("No data object with associated approval data");
        }
        if ((data.orderID ?? null) === null) {
          document.getElementById("feedback").innerHTML =
            "Error approving order";
          throw new Error("No orderID attribute with associated data object");
        }

        console.log("Received order approval event");

        console.log("Attempting to capture order");
        fetch(`${BASE_URL}/paypal/rest/order/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: data.orderID,
          }),
        })
          .then(async (response) => {
            if (response.status === 201) {
              console.log(
                `Order with ID ${data.orderID} successfully captured`
              );
              document.getElementById(
                "feedback"
              ).innerHTML = `Order with ID ${data.orderID} successfully captured`;
              document.getElementById("error").innerHTML = "";
              return response.json();
            } else {
              throw new Error((await response.json())?.message);
            }
          })
          .then((data) => {
            if ((data?.customerId ?? null) === null) {
              throw new Error(
                "No customer ID with associated vaulted customer"
              );
            }
            if ((data?.paymentMethodTokenId ?? null) === null) {
              throw new Error(
                "No payment method token ID with associated vaulted payment method"
              );
            }

            return [data.customerId, data.paymentMethodTokenId];
          })
          .then(([customerId, paymentMethodTokenId]) => {
            if (customerId && paymentMethodTokenId) {
              console.log(
                `Received customer ID: ${customerId} and payment method token ID: ${paymentMethodTokenId}`
              );
            } else if (customerId) {
              console.log(`Received customer ID: ${customerId}`);
            } else if (paymentMethodTokenId) {
              console.log(
                `Received payment method token ID: ${paymentMethodTokenId}`
              );
            } else {
              throw new Error(
                "No customer ID or payment method token ID with associated capture"
              );
            }

            let useLink = document.getElementById("use-link");
            useLink.hidden = false;
            if (customerId && paymentMethodTokenId) {
              useLink.setAttribute(
                "href",
                `../vault-paypal-redirect/index.html?customer-id=${customerId}&payment-method-token-id=${paymentMethodTokenId}`
              );
            } else if (customerId) {
              useLink.setAttribute(
                "href",
                `../vault-paypal-redirect/index.html?customer-id=${customerId}`
              );
            } else {
              useLink.setAttribute(
                "href",
                `../vault-paypal-redirect/index.html?payment-method-token-id=${paymentMethodTokenId}`
              );
            }
          })
          .catch(() => {
            document.getElementById("feedback").innerHTML =
              "Error approving order";
          });
      },
      onCancel(data) {
        if ((data ?? null) === null) {
          document.getElementById("feedback").innerHTML =
            "Error in cancel order callback";
          throw new Error("No data object with associated cancel data");
        }
        if ((data.orderID ?? null) === null) {
          document.getElementById("feedback").innerHTML =
            "Error in cancel order callback";
          throw new Error("No orderID attribute with associated data object");
        }

        document.getElementById(
          "feedback"
        ).innerHTML = `Order with ID ${data.orderID} was cancelled`;
        document.getElementById("error").innerHTML = "";
        console.log(`Order with ID ${data.orderID} was cancelled`);
      },
      onError(error) {
        console.error(error);
        document.getElementById("error").innerHTML = error.message;
      },
    })
    .render("#container");
}

main();
