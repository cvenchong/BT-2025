const BASE_URL = "http://localhost:8888";

function makePayment(paymentMethodTokenId) {
  if ((paymentMethodTokenId ?? null) === null) {
    console.error("No payment method token ID received");
    document.getElementById("feedback").innerHTML =
      "Error getting payment method token ID";
    document.getElementById("error").innerHTML =
      "No payment method token ID received";
    return;
  }

  console.log("Received make payment request");

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
        paypal: {
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
    .then((orderId) => {
      console.log(`Order with ID ${orderId} successfully created and captured`);
      document.getElementById(
        "feedback"
      ).innerHTML = `Order with ID ${orderId} successfully created and captured`;
      document.getElementById("error").innerHTML = "";
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML = "Error creating order";
      document.getElementById("error").innerHTML = error.message;
    });
}

console.log("Received initial render request");

console.log("Reading query parameters");
let queryParams = new URLSearchParams(window.location.search);
if (queryParams.has("customer-id")) {
  let customerId = queryParams.get("customer-id");
  console.log(`Using customer ID: ${customerId}`);

  console.log("Attempting to get ID token");
  fetch(`${BASE_URL}/paypal/rest/auth/id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerId: customerId,
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
        throw new Error("No token with associated ID token");
      }

      return data.token;
    })
    .then((IdToken) => {
      console.log(`ID token successfully obtained: ${IdToken}`);
      document.getElementById(
        "feedback"
      ).innerHTML = `ID token successfully obtained: ${IdToken}`;
      document.getElementById("error").innerHTML = "";

      let sdk = document.createElement("script");
      sdk.src =
        "https://www.paypal.com/sdk/js?client-id=AUivjUL_LNyZFzHIU9lbQ9-egUXMZUkqREhl9bDpr25-BOnu_G2qKRwLpzYNI7Oukqo-Az_danXFAXT6&components=buttons&currency=GBP&buyer-country=GB&disable-funding=card&commit=true&intent=capture";
      sdk.setAttribute("data-user-id-token", IdToken);
      sdk.type = "module";

      let script = document.createElement("script");
      script.src = "./index.js";
      script.type = "module";

      sdk.addEventListener("load", () => {
        document.body.appendChild(script);
      });

      document.head.appendChild(sdk);
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML = "Error getting ID token";
      document.getElementById("error").innerHTML = error.message;
      return undefined;
    });
} else {
  console.error("Couldn't read customer ID from query parameters");
  document.getElementById("feedback").innerHTML = "Error getting customer ID";
  document.getElementById("error").innerHTML =
    "Couldn't read customer ID from query parameters";
}

if (queryParams.has("payment-method-token-id")) {
  let submitButton = document.getElementById("submit-button");
  submitButton.removeAttribute("hidden");
  submitButton.addEventListener("click", () => {
    makePayment(queryParams.get("payment-method-token-id"));
  });
} else {
  console.error("Couldn't read payment method token ID from query parameters");
  document.getElementById("feedback").innerHTML =
    "Error getting payment method token ID";
  document.getElementById("error").innerHTML =
    "Couldn't read payment method token ID from query parameters";
}
