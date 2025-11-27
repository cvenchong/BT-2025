const BASE_URL = "http://localhost:8888";

function refundPayment() {
  console.log("Received refund payment request");

  console.log("Reading capture ID");
  let captureId = document
    .getElementById("refund-button")
    .getAttribute("data-capture-id");
  if ((captureId ?? null) === null) {
    console.error("Could not read capture ID");
    document.getElementById("feedback").innerHTML = "Error getting capture ID";
    document.getElementById("error").innerHTML = "Could not read capture ID";
    return;
  }
  console.log(`Successfully read capture ID: ${captureId}`);

  console.log(`Attempting to refund payment with capture ID ${captureId}`);
  fetch(`${BASE_URL}/paypal/sdk/payment/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      captureId: captureId,
    }),
  })
    .then(async (response) => {
      if (response.status === 204) {
        console.log(
          `Payment with capture ID ${captureId} successfully refunded`
        );
        document.getElementById(
          "feedback"
        ).innerHTML = `Payment with capture ID ${captureId} successfully refunded`;
        document.getElementById("error").innerHTML = "";

        let refundButton = document.getElementById("refund-button");
        refundButton.hidden = true;
        refundButton.setAttribute("data-capture-id", "");
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

        const purchaseUnits = [
          {
            referenceId: "asdf",
            description: "qwerty",
            amount: {
              currencyCode: "GBP",
              value: "78.50",
            },
            invoice_id: crypto.randomUUID(),
          },
        ];

        console.log("Attempting to create order");
        return fetch(`${BASE_URL}/paypal/sdk/order/new`, {
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
          document.getElementById("feedback").innerHTML =
            "Error approving order";
          throw new Error("No data object with associated approval data");
        }
        if ((data.orderID ?? null) === null) {
          document.getElementById("feedback").innerHTML =
            "Error approving order";
          throw new Error("No orderID attribute with associated data object");
        }

        console.log("Received order approval event");

        console.log("Attempting to capture order");
        fetch(`${BASE_URL}/paypal/sdk/order/capture`, {
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
              return response.json();
            } else {
              throw new Error((await response.json())?.message);
            }
          })
          .then((data) => {
            if ((data?.id ?? null) === null) {
              throw new Error("No capture ID with associated capture");
            }

            return data.id;
          })
          .then((captureId) => {
            console.log(
              `Order with ID ${data.orderID} successfully captured with cpature ID: ${captureId}`
            );
            document.getElementById(
              "feedback"
            ).innerHTML = `Order with ID ${data.orderID} successfully captured with capture ID: ${captureId}`;
            document.getElementById("error").innerHTML = "";

            let refundButton = document.getElementById("refund-button");
            refundButton.hidden = false;
            refundButton.setAttribute("data-capture-id", captureId);
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
