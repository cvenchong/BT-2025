const BASE_URL = "http://127.0.0.1:5000";

function payWithVaultedCustomer(customerId) {
  if ((customerId ?? null) === null) {
    console.error("No customer ID received");
    document.getElementById("feedback").innerHTML = "Error getting customer ID";
    document.getElementById("error").innerHTML = "No customer ID received";
    return;
  }

  console.log(`Finding customer information with ID ${customerId}`);
  fetch(`${BASE_URL}/braintree/sdk/customer/find`, {
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
        console.log(
          `Customer information with ID ${customerId} successfully found`
        );
        document.getElementById(
          "feedback"
        ).innerHTML = `Customer information with ID ${customerId} successfully found`;
        document.getElementById("error").innerHTML = "";
        return response.json();
      } else {
        throw new Error((await response.json())?.message);
      }
    })
    .then((data) => {
      if ((data?.paymentMethods ?? null) === null) {
        throw new Error("No payment methods associated with customer");
      }

      return data.paymentMethods;
    })
    .then((paymentMethods) => {
      if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
        throw new Error("No payment methods associated with customer");
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

      fetch(`${BASE_URL}/braintree/sdk/transaction/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: "10.00",
          paymentMethodToken: paymentMethodToken,
          storeInVaultOnSuccess: false,
          submitForSettlement: true,
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
          document.getElementById("error").innerHTML = error.message;
        });
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML =
        "Error finding customer information";
      document.getElementById("error").innerHTML = error.message;
    });
}

console.log("Reading query parameters");
let queryParams = new URLSearchParams(window.location.search);
if (queryParams.has("customer-id")) {
  let customerId = queryParams.get("customer-id");
  console.log(`Using customer ID: ${customerId}`);

  document.getElementById("pay-button").addEventListener("click", () => {
    payWithVaultedCustomer(customerId);
  });
} else {
  console.error("Couldn't read customer ID from query parameters");
  document.getElementById("feedback").innerHTML = "Error getting customer ID";
  document.getElementById("error").innerHTML =
    "Couldn't read customer ID from query parameters";
}
