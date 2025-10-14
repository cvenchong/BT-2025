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
                        `Transaction with ID ${transactionId} successfully created and settled`
                      );
                      document.getElementById(
                        "feedback"
                      ).innerHTML = `Transaction with ID ${transactionId} successfully created and settled`;
                      document.getElementById("error").innerHTML = "";
                    })
                    .catch((error) => {
                      // if there is error.code, then it was tokenisation error
                      if (error?.code) {
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
                        "Error creating transaction";
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
