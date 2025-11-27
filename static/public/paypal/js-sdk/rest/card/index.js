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
    async createOrder() {
      console.log("Received order creation request");

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
      return fetch(`${BASE_URL}/paypal/rest/order/new`, {
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
        .catch(() => {
          document.getElementById("feedback").innerHTML =
            "Error creating order";
          return undefined;
        });
    },
    onApprove(data) {
      if ((data ?? null) === null) {
        document.getElementById("feedback").innerHTML = "Error approving order";
        throw new Error("No data object with associated approval data");
      }
      if ((data.orderID ?? null) === null) {
        document.getElementById("feedback").innerHTML = "Error approving order";
        throw new Error("No orderID attribute with associated data object");
      }

      console.log("Received order approval event");

      console.log("Attempting to capture order");
      fetch(`${BASE_URL}/paypal/rest/order/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: data.orderID,
        }),
      })
        .then(async (response) => {
          if (response.status === 201) {
            console.log(`Order with ID ${data.orderID} successfully captured`);
            document.getElementById(
              "feedback"
            ).innerHTML = `Order with ID ${data.orderID} successfully captured`;
            document.getElementById("error").innerHTML = "";
          } else {
            throw new Error((await response.json())?.message);
          }
        })
        .catch(() => {
          document.getElementById("feedback").innerHTML =
            "Error approving order";
        });
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
