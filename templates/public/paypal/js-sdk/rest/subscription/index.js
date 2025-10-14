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
      async createSubscription() {
        console.log("Received subscription creation request");

        const billingCycles = [
          {
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 5,
            pricing_scheme: {
              fixed_price: {
                currency_code: "GBP",
                value: "5.00",
              },
            },
            frequency: {
              interval_unit: "DAY",
              interval_count: 1,
            },
          },
        ];
        const paymentPreferences = {
          setup_fee: {
            currency_code: "GBP",
            value: "10.00",
          },
        };

        console.log("Attempting to create product");
        return fetch(`${BASE_URL}/paypal/rest/product/new`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "asdf",
            description: "qwerty",
            type: "DIGITAL",
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
              throw new Error("No product ID with associated created product");
            }

            return data.id;
          })
          .then(async (productId) => {
            console.log(`Product with ID ${productId} successfully created`);

            console.log("Attempting to create plan");
            return fetch(`${BASE_URL}/paypal/rest/subscription/plan`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                productId: productId,
                name: "asdf",
                description: "qwerty",
                billingCycles: billingCycles,
                paymentPreferences: paymentPreferences,
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
                  throw new Error("No plan ID with associated created plan");
                }

                return data.id;
              })
              .then(async (planId) => {
                console.log(`Plan with ID ${planId} successfully created`);

                console.log("Attempting to create subscription");
                return fetch(`${BASE_URL}/paypal/rest/subscription/new`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    planId: planId,
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
                        "No subscription ID with associated created subscription"
                      );
                    }

                    return data.id;
                  })
                  .then((subscriptionId) => {
                    console.log(
                      `Subscription with ID ${subscriptionId} successfully created`
                    );
                    return subscriptionId;
                  })
                  .catch((error) => {
                    document.getElementById("feedback").innerHTML =
                      error.message;
                    console.error(error);
                    return undefined;
                  });
              })
              .catch((error) => {
                document.getElementById("feedback").innerHTML = error.message;
                console.error(error);
                return undefined;
              });
          })
          .catch(() => {
            document.getElementById("feedback").innerHTML =
              "Error creating subscription";
            return undefined;
          });
      },
      onApprove(data) {
        if ((data ?? null) === null) {
          document.getElementById("feedback").innerHTML =
            "Error approving subscription";
          throw new Error("No data object with associated approval data");
        }
        if ((data.subscriptionID ?? null) === null) {
          document.getElementById("feedback").innerHTML =
            "Error approving subscription";
          throw new Error(
            "No subscriptionID attribute with associated data object"
          );
        }

        console.log("Received subscription approval event");

        console.log(
          `Subscription with ID ${data.subscriptionID} successfully subscribed to`
        );
        document.getElementById(
          "feedback"
        ).innerHTML = `Subscription with ID ${data.subscriptionID} successfully subscribed to`;
        document.getElementById("error").innerHTML = "";
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
