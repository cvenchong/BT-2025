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
      async createVaultSetupToken() {
        console.log("Received create setup token request");

        console.log("Attempting to create setup token");
        return fetch(`${BASE_URL}/paypal/rest/setupToken/new`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentSource: {
              paypal: {
                store_in_vault: "ON_SUCCESS",
                usage_type: "MERCHANT",
                customer_type: "CONSUMER",
                permit_multiple_payment_tokens: true,
                experience_context: {
                  // TODO: play around with
                  return_url:
                    "http://localhost:5500/public/JS-SDK/vault-no-purchase-paypal/index.html",
                  // TODO: play around with
                  cancel_url:
                    "http://localhost:5500/public/JS-SDK/vault-no-purchase-paypal/index.html",
                  // TODO: play around with
                  shipping_preference: "NO_SHIPPING",
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
              throw new Error(
                "No setup token ID with associated created setup token"
              );
            }

            return data.id;
          })
          .then((setupTokenId) => {
            console.log(
              `Setup token with ID ${setupTokenId} successfully created`
            );
            document.getElementById(
              "feedback"
            ).innerHTML = `Setup token with ID ${setupTokenId} successfully created`;
            document.getElementById("error").innerHTML = "";
            return setupTokenId;
          })
          .catch(() => {
            document.getElementById("feedback").innerHTML =
              "Error creating setup token";
            return undefined;
          });
      },
      onApprove(data) {
        if ((data ?? null) === null) {
          document.getElementById("feedback").innerHTML =
            "Error approving setup token";
          throw new Error("No data object with associated approval data");
        }
        if ((data.vaultSetupToken ?? null) === null) {
          document.getElementById("feedback").innerHTML =
            "Error approving setup token";
          throw new Error(
            "No vaultSetupToken attribute with associated data object"
          );
        }

        console.log("Received setup token approval event");

        console.log("Attempting to create payment method token");
        fetch(`${BASE_URL}/paypal/rest/paymentMethodToken/new`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentSource: {
              token: {
                id: data.vaultSetupToken,
                type: "SETUP_TOKEN",
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
              throw new Error(
                "No payment method token ID with associated created payment method token"
              );
            }
            if ((data?.customerId ?? null) === null) {
              throw new Error(
                "No customer ID with associated vaulted customer"
              );
            }

            return [data.id, data.customerId];
          })
          .then(([paymentMethodTokenId, customerId]) => {
            console.log(
              `Payment method token with ID: ${paymentMethodTokenId} and customer ID: ${customerId} successfully created`
            );
            document.getElementById(
              "feedback"
            ).innerHTML = `Payment method token with ID: ${paymentMethodTokenId} and customer ID: ${customerId} successfully created`;
            document.getElementById("error").innerHTML = "";

            let useLink = document.getElementById("use-link");
            useLink.hidden = false;
            useLink.setAttribute(
              "href",
              `../vault-paypal-redirect/index.html?customer-id=${customerId}&payment-method-token-id=${paymentMethodTokenId}`
            );
          })
          .catch(() => {
            document.getElementById("feedback").innerHTML =
              "Error creating payment method token";
          });
      },
      onCancel() {
        document.getElementById(
          "feedback"
        ).innerHTML = `Payment method token setup was cancelled`;
        document.getElementById("error").innerHTML = "";
        console.log(`Payment method token setup was cancelled`);
      },
      onError(error) {
        console.error(error);
        document.getElementById("error").innerHTML = error.message;
      },
    })
    .render("#container");
}

main();
