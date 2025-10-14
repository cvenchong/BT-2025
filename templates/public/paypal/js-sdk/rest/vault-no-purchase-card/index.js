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
  if ((paypal.CardFields ?? null) === null) {
    console.error("No CardFields method with associated paypal object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No CardFields method with associated paypal object";
    return;
  }

  // eslint-disable-next-line no-undef
  const cardFields = paypal.CardFields({
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
            card: {
              experience_context: {
                // TODO: play around with
                return_url:
                  "http://localhost:5500/public/JS-SDK/vault-no-purchase-card/index.html",
                // TODO: play around with
                cancel_url:
                  "http://localhost:5500/public/JS-SDK/vault-no-purchase-card/index.html",
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

          return data.id;
        })
        .then((paymentMethodTokenId) => {
          console.log(
            `Payment method token with ID: ${paymentMethodTokenId} successfully created`
          );
          document.getElementById(
            "feedback"
          ).innerHTML = `Payment method token with ID: ${paymentMethodTokenId} successfully created`;
          document.getElementById("error").innerHTML = "";

          let useLink = document.getElementById("use-link");
          useLink.hidden = false;
          useLink.setAttribute(
            "href",
            `../vault-card-redirect/index.html?payment-method-token-id=${paymentMethodTokenId}`
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
  });

  if ((cardFields ?? null) === null) {
    console.error("No cardFields object with associated card fields");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No cardFields object with associated card fields";
    return;
  }
  if ((cardFields.isEligible ?? null) === null) {
    console.error("No isEligible method with associated cardFields object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No isEligible method with associated cardFields object";
    return;
  }
  if ((cardFields.NameField ?? null) === null) {
    console.error("No NameField method with associated cardFields object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No NameField method with associated cardFields object";
    return;
  }
  if ((cardFields.NumberField ?? null) === null) {
    console.error("No NumberField method with associated cardFields object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No NumberField method with associated cardFields object";
    return;
  }
  if ((cardFields.ExpiryField ?? null) === null) {
    console.error("No ExpiryField method with associated cardFields object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No ExpiryField method with associated cardFields object";
    return;
  }
  if ((cardFields.CVVField ?? null) === null) {
    console.error("No CVVField method with associated cardFields object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No CVVField method with associated cardFields object";
    return;
  }
  if ((cardFields.submit ?? null) === null) {
    console.error("No submit method with associated cardFields object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No submit method with associated cardFields object";
    return;
  }

  if (!cardFields.isEligible()) {
    console.error("Card fields unavailable");
    document.getElementById("feedback").innerHTML = "Card fields unavailable";
    return;
  }

  console.log("Card fields available");
  cardFields.NameField().render("#card-name-field-container");
  cardFields.NumberField().render("#card-number-field-container");
  cardFields.ExpiryField().render("#card-expiry-date-field-container");
  cardFields.CVVField().render("#card-cvv-field-container");

  document
    .getElementById("card-field-submit-button")
    .addEventListener("click", () => {
      cardFields
        .submit()
        .then(() => {
          console.log("Card fields submitted successfully");
          document.getElementById("feedback").innerHTML =
            "Card fields submitted successfully";
          document.getElementById("error").innerHTML = "";
        })
        .catch((error) => {
          console.error(error);
          document.getElementById("feedback").innerHTML =
            "Error submitting card fields";
          document.getElementById("error").innerHTML = error.message;
        });
    });
}

main();
