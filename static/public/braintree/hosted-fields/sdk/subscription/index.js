const merchantAccountId = "stevenchong";
const BASE_URL = "http://127.0.0.1:5000";

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
  if ((braintree.hostedFields ?? null) === null) {
    console.error("No hostedFields attribute with associated braintree object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No hostedFields attribute with associated braintree object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.hostedFields.create ?? null) === null) {
    console.error(
      "No create method with associated braintree.hostedFields object"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No create method with associated braintree.hostedFields object";
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

          console.log("Initialising hosted fields");

          // eslint-disable-next-line no-undef
          braintree.hostedFields
            .create({
              client: client,
              fields: {
                number: {
                  container: document.getElementById("card-number"),
                },
                expirationDate: {
                  container: document.getElementById("expiration-date"),
                },
                cvv: {
                  container: document.getElementById("cvv"),
                },
                postalCode: {
                  container: document.getElementById("postal-code"),
                },
              },
              styles: {
                input: "input",
              },
            })
            .then((hostedFields) => {
              if ((hostedFields ?? null) === null) {
                throw new Error(
                  "No hostedFields object with associated hosted fields"
                );
              }
              if ((hostedFields.tokenize ?? null) === null) {
                throw new Error(
                  "No tokenize method with associated hostedFields object"
                );
              }

              document
                .getElementById("form")
                .addEventListener("submit", (event) => {
                  console.log("Received submit event");

                  event.preventDefault();

                  // hide existing error messages
                  let errorMessages = document.getElementsByClassName("error");
                  for (let i = 0; i < errorMessages.length; i++) {
                    errorMessages.item(i).hidden = true;
                  }

                  console.log("Getting payment method details");
                  hostedFields
                    .tokenize()
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

                      console.log("Creating customer");
                      return fetch(`${BASE_URL}/braintree/sdk/customer/new`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          paymentMethodNonce: nonce,
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
                      if ((data?.customerId ?? null) === null) {
                        throw new Error(
                          "No customer ID with associated created customer"
                        );
                      }

                      return data.customerId;
                    })
                    .then((customerId) => {
                      console.log(
                        `Successfully created customer with ID ${customerId}`
                      );
                      document.getElementById(
                        "feedback"
                      ).innerHTML = `Successfully created customer with ID ${customerId}`;
                      document.getElementById("error").innerHTML = "";

                      console.log(
                        `Finding payment method token from customer with ID ${customerId}`
                      );
                      return fetch(`${BASE_URL}/braintree/sdk/customer/find`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          customerId: customerId,
                        }),
                      });
                    })
                    .then(async (response) => {
                      if (response.status === 200) {
                        console.log(`Customer information successfully found`);
                        document.getElementById(
                          "feedback"
                        ).innerHTML = `Customer information successfully found`;
                        document.getElementById("error").innerHTML = "";
                        return response.json();
                      } else {
                        throw new Error((await response.json())?.message);
                      }
                    })
                    .then((data) => {
                      if ((data?.paymentMethods ?? null) === null) {
                        throw new Error(
                          "No payment methods associated with customer"
                        );
                      }

                      return data.paymentMethods;
                    })
                    .then((paymentMethods) => {
                      if (
                        !Array.isArray(paymentMethods) ||
                        paymentMethods.length === 0
                      ) {
                        throw new Error(
                          "No payment methods associated with customer"
                        );
                      }
                      return paymentMethods[0];
                    })
                    .then((paymentMethod) => {
                      if ((paymentMethod?.token ?? null) === null) {
                        throw new Error(
                          "No payment method token associated with vaulted payment method"
                        );
                      }
                      return paymentMethod.token;
                    })
                    .then((paymentMethodToken) => {
                      console.log(
                        `Successfully received payment method token: ${paymentMethodToken}`
                      );
                      document.getElementById(
                        "feedback"
                      ).innerHTML = `Successfully received payment method token: ${paymentMethodToken}`;
                      document.getElementById("error").innerHTML = "";

                      console.log("Creating plan");
                      return Promise.all([
                        fetch(`${BASE_URL}/braintree/sdk/plan/new`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            name: "Test Plan",
                            price: "15.00",
                            currencyCode: "GBP",
                            billingFrequency: 1,
                            numberOfBillingCycles: 2,
                          }),
                        }),
                        paymentMethodToken,
                      ]);
                    })
                    .then(async ([response, paymentMethodToken]) => {
                      if (response.status === 201) {
                        return Promise.all([
                          response.json(),
                          paymentMethodToken,
                        ]);
                      } else {
                        throw new Error((await response.json())?.message);
                      }
                    })
                    .then(([data, paymentMethodToken]) => {
                      if ((data?.planId ?? null) === null) {
                        throw new Error(
                          "No plan ID with associated created plan"
                        );
                      }

                      return [data.planId, paymentMethodToken];
                    })
                    .then(([planId, paymentMethodToken]) => {
                      console.log(
                        `Successfully created plan with ID ${planId}`
                      );
                      document.getElementById(
                        "feedback"
                      ).innerHTML = `Successfully created plan with ID ${planId}`;
                      document.getElementById("error").innerHTML = "";

                      console.log(
                        `Creating subscription using plan ID ${planId} and payment method token ${paymentMethodToken}`
                      );
                      return fetch(
                        `${BASE_URL}/braintree/sdk/subscription/new`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            planId: planId,
                            paymentMethodToken: paymentMethodToken,
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
                      if ((data?.subscriptionId ?? null) === null) {
                        throw new Error(
                          "No subscription ID with associated successful subscription"
                        );
                      }

                      return data.subscriptionId;
                    })
                    .then((subscriptionId) => {
                      console.log(
                        `Successfully created subscription with ID ${subscriptionId}`
                      );
                      document.getElementById(
                        "feedback"
                      ).innerHTML = `Successfully created subscription with ID ${subscriptionId}`;
                      document.getElementById("error").innerHTML = "";
                    })
                    .catch((error) => {
                      // if there is error.code, then it was tokenisation error
                      if (error.code) {
                        // only show error messages on specific fields for specific errors
                        switch (error.code) {
                          case "HOSTED_FIELDS_FIELDS_INVALID": {
                            if (error?.details?.invalidFields) {
                              let invalidFields = error.details.invalidFields;
                              for (let fieldKey in invalidFields) {
                                let errorElement = document.getElementById(
                                  `${invalidFields[fieldKey].id}-error`
                                );
                                errorElement.innerHTML = "Invalid value";
                                errorElement.hidden = false;
                              }
                            }
                            break;
                          }
                          case "HOSTED_FIELDS_TOKENIZATION_CVV_VERIFICATION_FAILED": {
                            let errorElement =
                              document.getElementById("cvv-error");
                            errorElement.innerHTML = "Invalid value";
                            errorElement.hidden = false;
                            break;
                          }
                        }
                      }

                      console.error(error);
                      document.getElementById("feedback").innerHTML =
                        "Error creating subscription";
                      document.getElementById("error").innerHTML =
                        error.message;
                    });
                });
            })
            .catch((error) => {
              console.error(error);
              document.getElementById("feedback").innerHTML =
                "Error initialising hosted fields";
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
