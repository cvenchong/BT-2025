const merchantAccountId = "stevenchongGBP";
const currencyCode = "GBP";
const buyerCountry = "GB";

// const merchantAccountId = "stevenchongGBP";
// const currencyCode = "GBP";
// const buyerCountry = "GB";

const state = { btclient:null, paypalCheckout:null }; 

//const merchantAccountId = "stevenustest_GBP";
const BASE_URL = "http://127.0.0.1:5000";

const OPTIONS = ["25.00", "12.50", "5.00", "3.00", "67.25", "137.75"];

function countTotal() {
  let checkboxes = document.getElementsByClassName("option");
  let total = 0;
  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes.item(i).checked) {
      total += Number(checkboxes.item(i).getAttribute("data-value"));
    }
  }
  return total;
}

function updateTotal() {
  let total = countTotal();
  document.getElementById("total").innerHTML = `Total: £${total.toFixed(2)}`;
  let messageContainer = document.getElementById("message-container")
  messageContainer.setAttribute("data-pp-amount", total.toFixed(2));
  messageContainer.setAttribute("data-pp-buyerCountry", buyerCountry); //is used for cross-border messaging to override the default messaging that a merchant account can do which would be where they are based out of i.e. a US merchant can only do US messaging and a JP merchant cannot do any messaging since they are based in JP
    
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

  // initialise options
  let option_container = document.getElementById("options-container");
  for (let i = 0; i < OPTIONS.length; i++) {
    let div = document.createElement("div");
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `option-${i}`;
    checkbox.className = "option";
    checkbox.setAttribute("data-value", `${OPTIONS[i]}`);
    checkbox.addEventListener("click", updateTotal);
    div.appendChild(checkbox);
    let text = document.createElement("label");
    text.setAttribute("for", `option-${i}`);
    text.innerHTML = `£${OPTIONS[i]}`;
    div.appendChild(text);
    option_container.appendChild(div);
  }

  //preset 
  let checkboxes = document.getElementsByClassName("option");
  // preselect last option
  checkboxes.item(checkboxes.length-1).checked = true;

  updateTotal();

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
          state.btclient = client;

          // eslint-disable-next-line no-undef
          braintree.paypalCheckout
            .create({
              client: client,
              merchantAccountId: merchantAccountId,
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
              state.paypalCheckout = paypalCheckout;
              console.log("Client and PayPal checkout successfully initialised");
              console.log("state.paypalCheckout:  ", state.paypalCheckout);

              paypalCheckout
                .loadPayPalSDK({
                  "buyer-country": buyerCountry, //this is for the 2nd button. For messaging, set the data attribute on the container
                  currency: currencyCode,
                  intent: "capture",
                  locale: "en_GB",
                  components: "buttons,messages",
                  "enable-funding": "paylater",
                  dataAttributes: {
                      amount: countTotal().toFixed(2)
                  }
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
                            intent: "capture",
                            amount: countTotal().toFixed(2),
                            currency: currencyCode,
                          })
                          .then((orderId) => {
                            if ((orderId ?? null) === null) {
                              throw new Error(
                                "No order ID with associated created order"
                              );
                            }

                            console.log(
                              `Order with ID ${orderId} successfully created`
                            );
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
                                  amount: countTotal().toFixed(2),
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
