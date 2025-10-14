const merchantAccountId = "stevenchong";
const BASE_URL = "http://127.0.0.1:5000";

function settleTransaction() {
  console.log("Received settle transaction request");

  console.log("Reading transaction ID");
  let transactionId = document
    .getElementById("settle-button")
    .getAttribute("data-transaction-id");
  if ((transactionId ?? null) === null) {
    console.error("Could not read transaction ID");
    document.getElementById("feedback").innerHTML =
      "Error getting transaction ID";
    document.getElementById("error").innerHTML =
      "Could not read transaction ID";
    return;
  }
  console.log(`Successfully read transaction ID: ${transactionId}`);

  console.log(
    `Attempting to settle transaction with transaction ID ${transactionId}`
  );
  fetch(`${BASE_URL}/braintree/sdk/transaction/settle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transactionId: transactionId,
    }),
  })
    .then(async (response) => {
      if (response.status === 204) {
        console.log(
          `Transaction with transaction ID ${transactionId} successfully settled`
        );
        document.getElementById(
          "feedback"
        ).innerHTML = `Transaction with transaction ID ${transactionId} successfully settled`;
        document.getElementById("error").innerHTML = "";

        let settleButton = document.getElementById("settle-button");
        settleButton.hidden = true;
        settleButton.setAttribute("data-transaction-id", "");

        let voidButton = document.getElementById("void-button");
        voidButton.hidden = true;
        voidButton.setAttribute("data-transaction-id", "");
      } else {
        throw new Error((await response.json())?.message);
      }
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML =
        "Error settling transaction";
      document.getElementById("error").innerHTML = error.message;
    });
}

function voidTransaction() {
  console.log("Received void transaction request");

  console.log("Reading transaction ID");
  let transactionId = document
    .getElementById("void-button")
    .getAttribute("data-transaction-id");
  if ((transactionId ?? null) === null) {
    console.error("Could not read transaction ID");
    document.getElementById("feedback").innerHTML =
      "Error getting transaction ID";
    document.getElementById("error").innerHTML =
      "Could not read transaction ID";
    return;
  }
  console.log(`Successfully read transaction ID: ${transactionId}`);

  console.log(
    `Attempting to void transaction with transaction ID ${transactionId}`
  );
  fetch(`${BASE_URL}/braintree/sdk/transaction/void`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transactionId: transactionId,
    }),
  })
    .then(async (response) => {
      if (response.status === 204) {
        console.log(
          `Transaction with transaction ID ${transactionId} successfully voided`
        );
        document.getElementById(
          "feedback"
        ).innerHTML = `Transaction with transaction ID ${transactionId} successfully voided`;
        document.getElementById("error").innerHTML = "";

        let settleButton = document.getElementById("settle-button");
        settleButton.hidden = true;
        settleButton.setAttribute("data-transaction-id", "");

        let voidButton = document.getElementById("void-button");
        voidButton.hidden = true;
        voidButton.setAttribute("data-transaction-id", "");
      } else {
        throw new Error((await response.json())?.message);
      }
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML =
        "Error voiding transaction";
      document.getElementById("error").innerHTML = error.message;
    });
}

function main() {
  // eslint-disable-next-line no-undef
  if ((braintree ?? null) === null) {
    console.error(
      "No braintree object with associated loaded Braintree script"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No braintree object with associated loaded Braintree script";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.client ?? null) === null) {
    console.error("No client attribute with associated braintree object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No client attribute with associated braintree object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.client.create ?? null) === null) {
    console.error("No create method with associated braintree.client object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No create method with associated braintree.client object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.paypalCheckout ?? null) === null) {
    console.error(
      "No paypalCheckout attribute with associated braintree object"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No paypalCheckout attribute with associated braintree object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.paypalCheckout.create ?? null) === null) {
    console.error(
      "No create method with associated braintree.paypalCheckout object"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No create method with associated braintree.paypalCheckout object";
    return;
  }

  document
    .getElementById("settle-button")
    .addEventListener("click", settleTransaction);
  document
    .getElementById("void-button")
    .addEventListener("click", voidTransaction);

  fetch(`${BASE_URL}/braintree/sdk/auth/client`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    merchantAccountId: merchantAccountId,
  }),
})
    .then(async (response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error((await response.json())?.message);
      }
    })
    .then((data) => {
      if ((data?.token ?? null) === null) {
        throw new Error("No client token received");
      }

      return data.token;
    })
    .then((clientToken) => {
      console.log(`Client token successfully obtained: ${clientToken}`);
      document.getElementById(
        "feedback"
      ).innerHTML = `Client token successfully obtained: ${clientToken}`;
      document.getElementById("error").innerHTML = "";

      console.log("Initialising client");

      // eslint-disable-next-line no-undef
      braintree.client
        .create({
          authorization: clientToken,
        })
        .then((client) => {
          if ((client ?? null) === null) {
            throw new Error("No client object with associated client");
          }

          console.log("Initialising PayPal checkout");

          // eslint-disable-next-line no-undef
          braintree.paypalCheckout
            .create({
              client: client,
              merchantAccountId: "test",
            })
            .then((paypalCheckout) => {
              if ((paypalCheckout ?? null) === null) {
                throw new Error(
                  "No paypalCheckout object with associated PayPal checkout"
                );
              }
              if ((paypalCheckout.loadPayPalSDK ?? null) === null) {
                throw new Error(
                  "No loadPayPalSDK method with associated paypalCheckout object"
                );
              }
              if ((paypalCheckout.createPayment ?? null) === null) {
                throw new Error(
                  "No createPayment method with associated paypalCheckout object"
                );
              }
              if ((paypalCheckout.tokenizePayment ?? null) === null) {
                throw new Error(
                  "No tokenizePayment method with associated paypalCheckout object"
                );
              }

              paypalCheckout
                .loadPayPalSDK({
                  "buyer-country": "GB",
                  currency: "GBP",
                  intent: "authorize",
                  locale: "en_GB",
                })
                .then(() => {
                  // eslint-disable-next-line no-undef
                  if ((paypal ?? null) === null) {
                    console.error(
                      "No paypal object with associated loaded PayPal script"
                    );
                    document.getElementById("feedback").innerHTML =
                      "Error loading scripts";
                    document.getElementById("error").innerHTML =
                      "No paypal object with associated loaded PayPal script";
                    return;
                  }
                  // eslint-disable-next-line no-undef
                  if ((paypal.Buttons ?? null) === null) {
                    console.error(
                      "No Buttons method with associated paypal object"
                    );
                    document.getElementById("feedback").innerHTML =
                      "Error loading scripts";
                    document.getElementById("error").innerHTML =
                      "No Buttons method with associated paypal object";
                    return;
                  }

                  // eslint-disable-next-line no-undef
                  paypal
                    .Buttons({
                      createOrder() {
                        console.log("Received order creation request");

                        console.log("Attempting to create order");
                        return paypalCheckout
                          .createPayment({
                            flow: "checkout",
                            intent: "authorize",
                            amount: "10.00",
                            currency: "GBP",
                          })
                          .then((orderID) => {
                            if ((orderID ?? null) === null) {
                              throw new Error(
                                "No order ID with associated created order"
                              );
                            }

                            console.log(
                              `Order with ID ${orderID} successfully created`
                            );
                            document.getElementById(
                              "feedback"
                            ).innerHTML = `Order with ID ${orderID} successfully created`;
                            document.getElementById("error").innerHTML = "";
                            return orderID;
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
                          throw new Error(
                            "No data object with associated approval data"
                          );
                        }
                        if ((data.payerID ?? null) === null) {
                          document.getElementById("feedback").innerHTML =
                            "Error approving order";
                          throw new Error(
                            "No payerID attribute with associated data object"
                          );
                        }
                        if ((data.paymentID ?? null) === null) {
                          document.getElementById("feedback").innerHTML =
                            "Error approving order";
                          throw new Error(
                            "No paymentID attribute with associated data object"
                          );
                        }

                        console.log("Received order approval event");

                        console.log("Attempting to capture order");
                        paypalCheckout
                          .tokenizePayment({
                            payerID: data.payerID,
                            paymentID: data.paymentID,
                            vault: false,
                          })
                          .then((payload) => {
                            if ((payload?.nonce ?? null) === null) {
                              throw new Error("No nonce received");
                            }

                            return payload.nonce;
                          })
                          .then((nonce) => {
                            console.log(
                              `Successfully received payment nonce: ${nonce}`
                            );

                            console.log("Creating transaction");
                            return fetch(
                              `${BASE_URL}/braintree/sdk/transaction/new`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  amount: "10.00",
                                  paymentMethodNonce: nonce,
                                  storeInVaultOnSuccess: false,
                                  submitForSettlement: false,
                                }),
                              }
                            );
                          })
                          .then(async (response) => {
                            if (response.status === 201) {
                              return response.json();
                            } else {
                              throw new Error((await response.json())?.message);
                            }
                          })
                          .then((data) => {
                            if ((data?.transactionId ?? null) === null) {
                              throw new Error(
                                "No transaction ID with associated successful transaction"
                              );
                            }

                            return data.transactionId;
                          })
                          .then((transactionId) => {
                            console.log(
                              `Order with ID ${data.orderID} and transaction with ID ${transactionId} successfully created`
                            );
                            document.getElementById(
                              "feedback"
                            ).innerHTML = `Order with ID ${data.orderID} and transaction with ID ${transactionId} successfully created`;
                            document.getElementById("error").innerHTML = "";

                            let settleButton =
                              document.getElementById("settle-button");
                            settleButton.hidden = false;
                            settleButton.setAttribute(
                              "data-transaction-id",
                              transactionId
                            );

                            let voidButton =
                              document.getElementById("void-button");
                            voidButton.hidden = false;
                            voidButton.setAttribute(
                              "data-transaction-id",
                              transactionId
                            );
                          })
                          .catch(() => {
                            document.getElementById("feedback").innerHTML =
                              "Error capturing order";
                          });
                      },
                      onCancel(data) {
                        if ((data ?? null) === null) {
                          document.getElementById("feedback").innerHTML =
                            "Error in cancel order callback";
                          throw new Error(
                            "No data object with associated cancel data"
                          );
                        }
                        if ((data.orderID ?? null) === null) {
                          document.getElementById("feedback").innerHTML =
                            "Error in cancel order callback";
                          throw new Error(
                            "No orderID attribute with associated data object"
                          );
                        }

                        document.getElementById(
                          "feedback"
                        ).innerHTML = `Order with ID ${data.orderID} was cancelled`;
                        document.getElementById("error").innerHTML = "";
                        console.log(
                          `Order with ID ${data.orderID} was cancelled`
                        );
                      },
                      onError(error) {
                        console.error(error);
                        document.getElementById("error").innerHTML =
                          error.message;
                      },
                    })
                    .render("#paypal-button");
                });
            })
            .catch((error) => {
              console.error(error);
              document.getElementById("feedback").innerHTML =
                "Error initialising PayPal checkout";
              document.getElementById("error").innerHTML = error.message;
            });
        })
        .catch((error) => {
          console.error(error);
          document.getElementById("feedback").innerHTML =
            "Error initialising client";
          document.getElementById("error").innerHTML = error.message;
        });
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML =
        "Error getting client token";
      document.getElementById("error").innerHTML = error.message;
    });
}

main();
