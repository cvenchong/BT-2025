const BASE_URL = "http://localhost:8888";

function capturePayment() {
  console.log("Received capture payment request");

  console.log("Reading authorisation ID");
  let authorisationId = document
    .getElementById("capture-button")
    .getAttribute("data-authorisation-id");
  if ((authorisationId ?? null) === null) {
    console.error("Could not read authorisation ID");
    document.getElementById("feedback").innerHTML =
      "Error getting authorisation ID";
    document.getElementById("error").innerHTML =
      "Could not read authorisation ID";
    return;
  }
  console.log(`Successfully read authorisation ID: ${authorisationId}`);

  console.log(
    `Attempting to capture payment with authorisation ID ${authorisationId}`
  );
  fetch(`${BASE_URL}/paypal/sdk/payment/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      authorisationId: authorisationId,
    }),
  })
    .then(async (response) => {
      if (response.status === 204) {
        console.log(
          `Payment with authorisation ID ${authorisationId} successfully captured`
        );
        document.getElementById(
          "feedback"
        ).innerHTML = `Payment with authorisation ID ${authorisationId} successfully captured`;
        document.getElementById("error").innerHTML = "";

        let captureButton = document.getElementById("capture-button");
        captureButton.hidden = true;
        captureButton.setAttribute("data-authorisation-id", "");

        let voidButton = document.getElementById("void-button");
        voidButton.hidden = true;
        voidButton.setAttribute("data-authorisation-id", "");
      } else {
        throw new Error((await response.json())?.message);
      }
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML = "Error capturing payment";
      document.getElementById("error").innerHTML = error.message;
    });
}

function voidPayment() {
  console.log("Received void payment request");

  console.log("Reading authorisation ID");
  let authorisationId = document
    .getElementById("void-button")
    .getAttribute("data-authorisation-id");
  if ((authorisationId ?? null) === null) {
    console.error("Could not read authorisation ID");
    document.getElementById("feedback").innerHTML =
      "Error getting authorisation ID";
    document.getElementById("error").innerHTML =
      "Could not read authorisation ID";
    return;
  }
  console.log(`Successfully read authorisation ID: ${authorisationId}`);

  console.log(
    `Attempting to void payment with authorisation ID ${authorisationId}`
  );
  fetch(`${BASE_URL}/paypal/sdk/payment/void`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      authorisationId: authorisationId,
    }),
  })
    .then(async (response) => {
      if (response.status === 204) {
        console.log(
          `Payment with authorisation ID ${authorisationId} successfully voided`
        );
        document.getElementById(
          "feedback"
        ).innerHTML = `Payment with authorisation ID ${authorisationId} successfully voided`;
        document.getElementById("error").innerHTML = "";

        let captureButton = document.getElementById("capture-button");
        captureButton.hidden = true;
        captureButton.setAttribute("data-authorisation-id", "");

        let voidButton = document.getElementById("void-button");
        voidButton.hidden = true;
        voidButton.setAttribute("data-authorisation-id", "");
      } else {
        throw new Error((await response.json())?.message);
      }
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML = "Error voiding payment";
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
    .getElementById("capture-button")
    .addEventListener("click", capturePayment);
  document.getElementById("void-button").addEventListener("click", voidPayment);

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
            invoiceId: crypto.randomUUID(),
          },
        ];

        console.log("Attempting to create order");
        return fetch(`${BASE_URL}/paypal/sdk/order/new`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intent: "AUTHORIZE",
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

        console.log("Attempting to authorise order");
        fetch(`${BASE_URL}/paypal/sdk/order/authorise`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: data.orderID,
          }),
        })
          .then(async (response) => {
            if (response.status === 200) {
              return response.json();
            } else {
              throw new Error((await response.json())?.message);
            }
          })
          .then((responseData) => {
            if ((responseData?.id ?? null) === null) {
              throw new Error(
                "No authorisation ID with associated authorisation"
              );
            }

            return responseData.id;
          })
          .then((authorisationId) => {
            console.log(
              `Order with ID ${data.orderID} successfully authorised with authorisation ID ${authorisationId}`
            );
            document.getElementById(
              "feedback"
            ).innerHTML = `Order with ID ${data.orderID} successfully authorised with authorisation ID ${authorisationId}`;
            document.getElementById("error").innerHTML = "";

            let captureButton = document.getElementById("capture-button");
            captureButton.hidden = false;
            captureButton.setAttribute(
              "data-authorisation-id",
              authorisationId
            );

            let voidButton = document.getElementById("void-button");
            voidButton.hidden = false;
            voidButton.setAttribute("data-authorisation-id", authorisationId);
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
