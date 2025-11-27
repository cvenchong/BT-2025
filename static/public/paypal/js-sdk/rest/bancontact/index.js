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
  if ((paypal.Buttons ?? null) === null) {
    console.error("No Buttons method with associated paypal object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No Buttons method with associated paypal object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((paypal.FUNDING ?? null) === null) {
    console.error("No FUNDING attribute with associated paypal object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No FUNDING attribute with associated paypal object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((paypal.FUNDING.BANCONTACT ?? null) === null) {
    console.error(
      "No BANCONTACT attribute with associated paypal.FUNDING object"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No BANCONTACT attribute with associated paypal.FUNDING object";
    return;
  }

  // eslint-disable-next-line no-undef
  paypal
    .Buttons({
      // eslint-disable-next-line no-undef
      fundingSource: paypal.FUNDING.BANCONTACT,
      async createOrder() {
        console.log("Received order creation request");

        const purchaseUnits = [
          {
            reference_id: "asdf",
            description: "qwerty",
            amount: {
              currency_code: "EUR",
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
            if ((data ?? null) === null) {
              document.getElementById("feedback").innerHTML =
                "Error approving order";
              throw new Error("No data object with associated approval data");
            }
            if ((data.orderID ?? null) === null) {
              document.getElementById("feedback").innerHTML =
                "Error approving order";
              throw new Error(
                "No orderID attribute with associated data object"
              );
            }
            if ((data.payerID ?? null) === null) {
              document.getElementById("feedback").innerHTML =
                "Error approving order";
              throw new Error(
                "No payerID attribute with associated data object"
              );
            }

            if (response.status === 201) {
              console.log(
                `Order with ID ${data.orderID} successfully captured`
              );
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
    })
    .render("#container");
}

main();
