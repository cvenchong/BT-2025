const BASE_URL = "http://localhost:8888";

document.getElementById("submit-button").addEventListener("click", async () => {
  console.log("Reading query parameters");
  let queryParams = new URLSearchParams(window.location.search);
  if (!queryParams.has("payment-method-token-id")) {
    console.error(
      "Couldn't read payment method token ID from query parameters"
    );
    document.getElementById("feedback").innerHTML =
      "Error getting payment method token ID";
    document.getElementById("error").innerHTML =
      "Couldn't read payment method token ID from query parameters";
    return;
  }

  let paymentMethodTokenId = queryParams.get("payment-method-token-id");
  console.log(`Using payment method token ID: ${paymentMethodTokenId}`);

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
  fetch(`${BASE_URL}/paypal/rest/order/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchaseUnits: purchaseUnits,
      paymentSource: {
        card: {
          vault_id: paymentMethodTokenId,
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
        throw new Error("No order ID with associated created order");
      }

      return data.id;
    })
    .then((orderID) => {
      console.log(`Order with ID ${orderID} successfully created and captured`);
      document.getElementById(
        "feedback"
      ).innerHTML = `Order with ID ${orderID} successfully created and captured`;
      document.getElementById("error").innerHTML = "";
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML = "Error creating order";
      document.getElementById("error").innerHTML = error.message;
    });
});
