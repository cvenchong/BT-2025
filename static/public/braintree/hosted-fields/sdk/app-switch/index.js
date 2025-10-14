// NOTE: In Android Studio emulator, use 10.0.2.2 to access anything locally hosted on the actual device
const BASE_URL = "http://127.0.0.1:5000";
//const BASE_URL = "http://bt-steven-2025.ap-southeast-1.elasticbeanstalk.com"; // TODO: change to your own domain
const merchantAccountId = "stevenustest";
const currencyCode = "USD";
const amount = "10.00";
const buyerCountry = "US";
//const BASE_URL = "http://10.0.2.2:8888";

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

  console.log("Attempting to get client token");
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
              client: client
              //,
              //merchantAccountId: merchantAccountId,
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
                  "buyer-country": buyerCountry,
                  currency: currencyCode,
                  intent: "capture",
                  locale: "en_US",
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
                  console.log("PayPal checkout successfully initialised");
                  let return_cancel_url = `${BASE_URL}/public/braintree/hosted-fields/sdk/app-switch/index.html`;
                  console.log(`Return/cancel URL: ${return_cancel_url}`);
                  
                  console.log("Initialising PayPal buttons");
                  // eslint-disable-next-line no-undef
                  const buttons = paypal.Buttons({
                    appSwitchWhenAvailable: true,
                    createOrder: function () {
                      console.log("Attempting to create order");
                      var createPaymentRequestOptions = {
                          flow: "checkout",
                          intent: "capture",
                          amount: amount,
                          currency: currencyCode,
                          returnUrl: return_cancel_url,                             
                          cancelUrl: return_cancel_url,

                          appSwitchPreference: {
                            launchPaypalApp: true,
                          }
                        };
                        return paypalCheckout.createPayment(createPaymentRequestOptions);
                    // }
                      
                    //   return paypalCheckout
                    //     .createPayment({
                    //       flow: "checkout",
                    //       intent: "capture",
                    //       amount: amount,
                    //       currency: currencyCode,
                    //       // returnUrl: return_cancel_url,                             
                    //       // cancelUrl: return_cancel_url,

                    //       // appSwitchPreference: {
                    //       //   launchPaypalApp: true,
                    //       // }
                    //     })
                    //     .then((orderId) => {
                    //       if ((orderId ?? null) === null) {
                    //         throw new Error(
                    //           "No order ID with associated created order"
                    //         );
                    //       }

                    //       console.log(
                    //         `Order with ID ${orderId} successfully created`
                    //       );
                    //       document.getElementById(
                    //         "feedback"
                    //       ).innerHTML = `Order with ID ${orderId} successfully created`;
                    //       document.getElementById("error").innerHTML = "";
                    //       return orderId;
                    //     })
                    //     .catch(() => {
                    //       document.getElementById("feedback").innerHTML =
                    //         "Error creating order";
                    //       return undefined;
                    //     });
                    },
                    onApprove(data) {
                      // TODO: for debugging, remove later
                      console.log(JSON.stringify(data, null, 2));
                      console.log(`PayerID: ${new URLSearchParams(
                        window.location.href
                      ).get("PayerID")}
                      `);

                      if ((data ?? null) === null) {
                        document.getElementById("feedback").innerHTML =
                          "Error approving order";
                        throw new Error(
                          "No data object with associated approval data"
                        );
                      }
                      // TODO: payerID currently isn't in data object but should be, remove later when fixed
                      // if ((data.payerID ?? null) === null) {
                      //   document.getElementById("feedback").innerHTML =
                      //     "Error approving order";
                      //   throw new Error(
                      //     "No payerID attribute with associated data object"
                      //   );
                      // }
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
                          // TODO: temporary workaround, shouldn't be needed ideally, remove later
                          payerID: new URLSearchParams(
                            window.location.href
                          ).get("PayerID"),
                          // payerID: data.payerID,
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
                                amount: amount,
                                paymentMethodNonce: nonce,
                                storeInVaultOnSuccess: false,
                                submitForSettlement: true,
                                merchantAccountId: merchantAccountId,
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
                            `Order with ID ${data.orderID} and transaction with ID ${transactionId} successfully created and settled`
                          );
                          document.getElementById(
                            "feedback"
                          ).innerHTML = `Order with ID ${data.orderID} and transaction with ID ${transactionId} successfully created and settled`;
                          document.getElementById("error").innerHTML = "";
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
                  });

                  if (buttons.hasReturned()) {
                    console.log("Received buttons returned callback (AppSwitch)");
                    buttons.resume();
                  } else {
                    buttons.render("#paypal-button");
                  }
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
