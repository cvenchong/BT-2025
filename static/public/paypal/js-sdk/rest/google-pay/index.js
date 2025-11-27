const BASE_URL = "http://localhost:8888";

async function onApprove(paymentData) {
  console.log("Received onApprove event");
  document.getElementById("feedback").innerHTML = "Received onApprove event";
  document.getElementById("error").innerHTML = "";

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
  const id = await fetch(`${BASE_URL}/paypal/rest/order/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchaseUnits: purchaseUnits,
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
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML = "Error creating order";
      document.getElementById("error").innerHTML = error.message;
      return undefined;
    });

  if ((id ?? null) === null) {
    return;
  }

  // eslint-disable-next-line no-undef
  return await paypal
    .Googlepay()
    .confirmOrder({
      orderId: id,
      paymentMethodData: paymentData.paymentMethodData,
    })
    .then(async (response) => {
      if (response?.status === "APPROVED") {
        console.log("Attempting to capture order");
        return await fetch(`${BASE_URL}/paypal/rest/order/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: id,
          }),
        })
          .then(async (response) => {
            if (response.status === 201) {
              console.log(`Order with ID ${id} successfully captured`);
              document.getElementById(
                "feedback"
              ).innerHTML = `Order with ID ${id} successfully captured`;
              document.getElementById("error").innerHTML = "";

              return {
                transactionState: "SUCCESS",
              };
            } else {
              throw new Error((await response.json())?.message);
            }
          })
          .catch((error) => {
            console.error(error);
            document.getElementById("feedback").innerHTML =
              "Error approving order";
            document.getElementById("error").innerHTML = error.message;

            return {
              transactionState: "ERROR",
              error: {
                message: error.message,
              },
            };
          });
      } else {
        console.error("Order wasn't approved");
        document.getElementById("feedback").innerHTML = "";
        document.getElementById("error").innerHTML = "Order wasn't approved";

        return {
          transactionState: "ERROR",
          error: {
            message: "Order wasn't approved",
          },
        };
      }
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML = "Error approving order";
      document.getElementById("error").innerHTML = error.message;

      return {
        transactionState: "ERROR",
        error: {
          message: error.message,
        },
      };
    });
}

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
    paymentDataCallbacks: {
      onPaymentAuthorized: onApprove,
    },
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
  if ((paymentsClient.loadPaymentData ?? null) === null) {
    console.error(
      "No loadPaymentData method with associated paymentsClient object"
    );
    document.getElementById("feedback").innerHTML =
      "Error initialising Google Payment component";
    document.getElementById("error").innerHTML =
      "No loadPaymentData method with associated paymentsClient object";
    return;
  }

  // eslint-disable-next-line no-undef
  if ((paypal ?? null) === null) {
    console.error("No paypal object with associated loaded PayPal script");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No paypal object with associated loaded PayPal script";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((paypal.Googlepay ?? null) === null) {
    console.error("No Googlepay method with associated paypal object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No Googlepay method with associated paypal object";
    return;
  }

  // eslint-disable-next-line no-undef
  const googlePay = paypal.Googlepay();
  if ((googlePay ?? null) === null) {
    console.error("No googlePay object with associated Google Pay");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No googlePay object with associated Google Pay";
    return;
  }
  if ((googlePay.config ?? null) === null) {
    console.error("No config method with associated googlePay object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No config method with associated googlePay object";
    return;
  }

  googlePay
    .config()
    .then((googlePayConfig) => {
      if ((googlePayConfig?.apiVersion ?? null) === null) {
        throw new Error(
          "No api version with associated Google Pay configuration"
        );
      }
      if ((googlePayConfig?.apiVersionMinor ?? null) === null) {
        throw new Error(
          "No minor api version with associated Google Pay configuration"
        );
      }
      if ((googlePayConfig?.allowedPaymentMethods ?? null) === null) {
        throw new Error(
          "No allowed payment methods with associated Google Pay configuration"
        );
      }
      if ((googlePayConfig?.merchantInfo ?? null) === null) {
        throw new Error(
          "No merchant info with associated Google Pay configuration"
        );
      }
      if ((googlePayConfig?.countryCode ?? null) === null) {
        throw new Error(
          "No country code with associated Google Pay configuration"
        );
      }

      paymentsClient
        .isReadyToPay({
          apiVersion: googlePayConfig.apiVersion,
          apiVersionMinor: googlePayConfig.apiVersionMinor,
          allowedPaymentMethods: googlePayConfig.allowedPaymentMethods,
        })
        .then((response) => {
          if (response?.result) {
            try {
              const button = paymentsClient.createButton({
                onClick: () => {
                  console.log("Received onClick event");
                  document.getElementById("feedback").innerHTML =
                    "Received onClick event";
                  document.getElementById("error").innerHTML = "";

                  paymentsClient
                    .loadPaymentData({
                      apiVersion: googlePayConfig.apiVersion,
                      apiVersionMinor: googlePayConfig.apiVersionMinor,
                      merchantInfo: googlePayConfig.merchantInfo,
                      allowedPaymentMethods:
                        googlePayConfig.allowedPaymentMethods,
                      callbackIntents: ["PAYMENT_AUTHORIZATION"],
                      transactionInfo: {
                        countryCode: googlePayConfig.countryCode,
                        currencyCode: "GBP",
                        totalPrice: "78.50",
                        totalPriceStatus: "FINAL",
                      },
                    })
                    .catch((error) => {
                      console.error(error);
                      document.getElementById("error").innerHTML =
                        "Error loading payment data";
                      document.getElementById("feedback").innerHTML = error;
                    });
                },
              });

              document.getElementById("container").appendChild(button);
            } catch (error) {
              console.error(error);
              document.getElementById("feedback").innerHTML =
                "Error rendering button";
              document.getElementById("error").innerHTML = error.message;
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
          document.getElementById("error").innerHTML = error.message;
        });
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML =
        "Error getting Google Pay configuration";
      document.getElementById("error").innerHTML = error.message;
    });
}

main();
