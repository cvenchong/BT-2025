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
  if ((braintree.localPayment ?? null) === null) {
    console.error("No localPayment attribute with associated braintree object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No localPayment attribute with associated braintree object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.localPayment.create ?? null) === null) {
    console.error(
      "No create method with associated braintree.localPayment object"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No create method with associated braintree.localPayment object";
    return;
  }

  console.log("Attempting to get client token");
  fetch(`${BASE_URL}/braintree/sdk/auth/client`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchantAccountId: "test-EUR",
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

          console.log("Initialising local payment checkout");

          // eslint-disable-next-line no-undef
          braintree.localPayment
            .create({
              client: client,
              merchantAccountId: "test-EUR",
            })
            .then((localPayment) => {
              if ((localPayment ?? null) === null) {
                throw new Error(
                  "No localPayment object with associated local payment"
                );
              }
              if ((localPayment.startPayment ?? null) === null) {
                throw new Error(
                  "No startPayment method with associated localPayment object"
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

                  console.log("Getting form details");
                  const firstName =
                    document.forms["form"].elements["first-name"].value;
                  const lastName =
                    document.forms["form"].elements["last-name"].value;

                  // check for any empty inputs and display relevant errors if there are any
                  let emptyInput = false;
                  if (!firstName) {
                    const firstNameErrorElement =
                      document.getElementById("first-name-error");
                    firstNameErrorElement.innerHTML = "Missing value";
                    firstNameErrorElement.hidden = false;
                    emptyInput = true;
                  }
                  if (!lastName) {
                    const lastNameErrorElement =
                      document.getElementById("last-name-error");
                    lastNameErrorElement.innerHTML = "Missing value";
                    lastNameErrorElement.hidden = false;
                    emptyInput = true;
                  }
                  if (emptyInput) {
                    throw new Error("Missing form input values");
                  }

                  localPayment
                    .startPayment({
                      fallback: {
                        buttonText: "Complete Payment",
                        url: "localhost:5500/public/braintree/hosted-fields/sdk/ideal/index.html",
                      },
                      amount: "10.00",
                      currencyCode: "EUR",
                      paymentType: "ideal",
                      paymentTypeCountryCode: "NL",
                      givenName: firstName,
                      surname: lastName,
                      onPaymentStart: (_data, continueCallback) => {
                        continueCallback();
                      },
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
                            merchantAccountId: "test-EUR",
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
                "Error initialising local payment checkout";
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
