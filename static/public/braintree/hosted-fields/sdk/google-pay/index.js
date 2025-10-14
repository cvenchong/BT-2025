const merchantAccountId = "stevenchong";
const BASE_URL = "http://127.0.0.1:5000";

function main() {
  // eslint-disable-next-line no-undef
  if ((google ?? null) === null) {
    console.error("No google object with associated loaded Google Pay script");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No google object with associated loaded Google Pay script";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((google.payments ?? null) === null) {
    console.error("No payments attribute with associated google object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No payments attribute with associated google object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((google.payments.api ?? null) === null) {
    console.error("No api attribute with associated google.payments object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No api attribute with associated google.payments object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((google.payments.api.PaymentsClient ?? null) === null) {
    console.error(
      "No PaymentsClient method with associated google.payments.api object"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No PaymentsClient method with associated google.payments.api object";
    return;
  }

  // eslint-disable-next-line no-undef
  const paymentsClient = new google.payments.api.PaymentsClient({
    environment: "TEST",
  });
  if ((paymentsClient ?? null) === null) {
    console.error("No paymentsClient object with associated payments client");
    document.getElementById("feedback").innerHTML =
      "Error initialising Google Payment component";
    document.getElementById("error").innerHTML =
      "No paymentsClient object with associated payments client";
    return;
  }
  if ((paymentsClient.isReadyToPay ?? null) === null) {
    console.error(
      "No isReadyToPay method with associated paymentsClient object"
    );
    document.getElementById("feedback").innerHTML =
      "Error initialising Google Payment component";
    document.getElementById("error").innerHTML =
      "No isReadyToPay method with associated paymentsClient object";
    return;
  }
  if ((paymentsClient.createButton ?? null) === null) {
    console.error(
      "No createButton method with associated paymentsClient object"
    );
    document.getElementById("feedback").innerHTML =
      "Error initialising Google Payment component";
    document.getElementById("error").innerHTML =
      "No createButton method with associated paymentsClient object";
    return;
  }

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
  if ((braintree.googlePayment ?? null) === null) {
    console.error(
      "No googlePayment attribute with associated braintree object"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No googlePayment attribute with associated braintree object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.googlePayment.create ?? null) === null) {
    console.error(
      "No create method with associated braintree.googlePayment object"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No create method with associated braintree.googlePayment object";
    return;
  }

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

          console.log("Initialising Google Pay");

          // eslint-disable-next-line no-undef
          braintree.googlePayment
            .create({
              client: client,
              googlePayVersion: 2,
            })
            .then((googlePayment) => {
              if ((googlePayment ?? null) === null) {
                throw new Error(
                  "No googlePayment object with associated Google payment"
                );
              }
              if ((googlePayment.createPaymentDataRequest ?? null) === null) {
                throw new Error(
                  "No createPaymentDataRequest method with associated googlePayment object"
                );
              }
              if ((googlePayment.parseResponse ?? null) === null) {
                throw new Error(
                  "No parseResponse method with associated googlePayment object"
                );
              }

              const paymentDataRequest = googlePayment.createPaymentDataRequest(
                {
                  transactionInfo: {
                    currencyCode: "GBP",
                    countryCode: "GB",
                    totalPriceStatus: "FINAL",
                    totalPrice: "10.00",
                  },
                }
              );
              if ((paymentDataRequest ?? null) === null) {
                throw new Error(
                  "No paymentDataRequest object with associated payment data request"
                );
              }
              if ((paymentDataRequest.allowedPaymentMethods ?? null) === null) {
                throw new Error(
                  "No allowedPaymentMethods attribute with associated paymentDataRequest object"
                );
              }

              paymentsClient
                .isReadyToPay({
                  apiVersion: 2,
                  apiVersionMinor: 0,
                  allowedPaymentMethods:
                    paymentDataRequest.allowedPaymentMethods,
                })
                .then((response) => {
                  if (response.result) {
                    try {
                      const button = paymentsClient.createButton({
                        onClick: () => {
                          console.log("Received onClick event");
                          document.getElementById("feedback").innerHTML =
                            "Received onClick event";
                          document.getElementById("error").innerHTML = "";

                          paymentsClient
                            .loadPaymentData(paymentDataRequest)
                            .then((paymentData) => {
                              googlePayment
                                .parseResponse(paymentData)
                                .then((response) => {
                                  if ((response?.nonce ?? null) === null) {
                                    throw new Error("No nonce received");
                                  }

                                  return response.nonce;
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
                                        submitForSettlement: true,
                                      }),
                                    }
                                  );
                                })
                                .then(async (response) => {
                                  if (response.status === 201) {
                                    return response.json();
                                  } else {
                                    throw new Error(
                                      (await response.json())?.message
                                    );
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
                                    `Transaction with ID ${transactionId} successfully created and settled`
                                  );
                                  document.getElementById(
                                    "feedback"
                                  ).innerHTML = `Transaction with ID ${transactionId} successfully created and settled`;
                                  document.getElementById("error").innerHTML =
                                    "";
                                })
                                .catch((error) => {
                                  console.error(error);
                                  document.getElementById(
                                    "feedback"
                                  ).innerHTML = "Error creating transaction";
                                  document.getElementById("error").innerHTML =
                                    error;
                                });
                            })
                            .catch((error) => {
                              console.error(error);
                              document.getElementById("feedback").innerHTML =
                                "Error loading payment button";
                              document.getElementById("error").innerHTML =
                                error.message;
                            });
                        },
                      });

                      document.getElementById("container").appendChild(button);
                    } catch (error) {
                      console.error(error);
                      document.getElementById("feedback").innerHTML =
                        "Error rendering button";
                      document.getElementById("error").innerHTML =
                        error.message;
                    }
                  } else {
                    console.log("Google Pay is not supported");
                    document.getElementById("feedback").innerHTML =
                      "Google Pay is not supported";
                    document.getElementById("error").innerHTML = "";
                  }
                })
                .catch((error) => {
                  console.error(error);
                  document.getElementById("feedback").innerHTML =
                    "Error checking whether Google Pay is supported";
                  document.getElementById("error").innerHTML = "";
                });
            })
            .catch((error) => {
              console.error(error);
              document.getElementById("feedback").innerHTML =
                "Error initialising Google Payment component";
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
