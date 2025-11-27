const BASE_URL = "http://localhost:8888";
const ORDER_AMOUNT = "25.00";
const CURRENCY = "GBP";

function refundPayment() {
  console.log("Received refund payment request");

  console.log("Reading transaction ID");
  let transactionId = document
    .getElementById("refund-button")
    .getAttribute("data-transaction-id");
  if ((transactionId ?? null) === null) {
    console.error("Could not read transaction ID");
    document.getElementById("feedback").innerHTML =
      "Error getting transaction ID";
    document.getElementById("error").innerHTML =
      "Could not read transaction ID";
    return;
  }
  console.log(`Successfully read transaction ID: ${transactionId}`);

  console.log(
    `Attempting to refund payment with transaction ID ${transactionId}`
  );
  fetch(`${BASE_URL}/paypal/nvp/expressCheckout/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transactionId: transactionId,
    }),
  })
    .then(async (response) => {
      if (response.status === 204) {
        console.log(
          `Payment with transaction ID ${transactionId} successfully refunded`
        );
        document.getElementById(
          "feedback"
        ).innerHTML = `Payment with transaction ID ${transactionId} successfully refunded`;
        document.getElementById("error").innerHTML = "";

        let refundButton = document.getElementById("refund-button");
        refundButton.hidden = true;
        refundButton.setAttribute("data-transaction-id", "");
      } else {
        throw new Error((await response.json())?.message);
      }
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML = "Error refunding payment";
      document.getElementById("error").innerHTML = error.message;
    });
}

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

  document
    .getElementById("refund-button")
    .addEventListener("click", refundPayment);

  // eslint-disable-next-line no-undef
  paypal
    .Buttons({
      async createOrder() {
        console.log("Received order creation request");

        console.log("Attempting to create order");
        return fetch(`${BASE_URL}/paypal/nvp/expressCheckout/new`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: ORDER_AMOUNT,
            currency: CURRENCY,
            paymentAction: "Sale",
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
          document.getElementById("feedback").innerHTML =
            "Error approving order";
          throw new Error("No data object with associated approval data");
        }
        if ((data.orderID ?? null) === null) {
          document.getElementById("feedback").innerHTML =
            "Error approving order";
          throw new Error("No orderID attribute with associated data object");
        }
        if ((data.payerID ?? null) === null) {
          document.getElementById("feedback").innerHTML =
            "Error approving order";
          throw new Error("No payerID attribute with associated data object");
        }

        console.log("Received order approval event");

        console.log("Attempting to capture order");
        fetch(`${BASE_URL}/paypal/nvp/expressCheckout/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: data.orderID,
            payerId: data.payerID,
            amount: ORDER_AMOUNT,
            currency: CURRENCY,
            paymentAction: "Sale",
          }),
        })
          .then(async (response) => {
            if (response.status === 201) {
              console.log(
                `Order with ID ${data.orderID} successfully captured`
              );
              document.getElementById(
                "feedback"
              ).innerHTML = `Order with ID ${data.orderID} successfully captured`;
              document.getElementById("error").innerHTML = "";

              return response.json();
            } else {
              throw new Error((await response.json())?.message);
            }
          })
          .then((responseData) => {
            if ((responseData.transactionId ?? null) === null) {
              throw new Error(
                "No transaction ID with associated completed payment"
              );
            }

            return responseData.transactionId;
          })
          .then((transactionId) => {
            let refundButton = document.getElementById("refund-button");
            refundButton.hidden = false;
            refundButton.setAttribute("data-transaction-id", transactionId);
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
    })
    .render("#container");
}

main();
