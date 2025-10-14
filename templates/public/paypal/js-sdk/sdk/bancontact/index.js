const BASE_URL = "http://localhost:8888";

// eslint-disable-next-line no-undef
paypal
  .Buttons({
    // eslint-disable-next-line no-undef
    fundingSource: paypal.FUNDING.BANCONTACT,
    async createOrder() {
      console.log("Received order creation request");

      const purchaseUnits = [
        {
          referenceId: "asdf",
          description: "qwerty",
          amount: {
            currencyCode: "EUR",
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
