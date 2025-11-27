// NOTE: In Android Studio emulator, use 10.0.2.2 to access anything locally hosted on the actual device
// const BASE_URL = "http://localhost:8888";
const BASE_URL = "http://10.0.2.2:8888";

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
  const buttons = paypal.Buttons({
    appSwitchWhenAvailable: true,
    async createOrder() {
      console.log("Received order creation request");

      console.log("Attempting to create order");
      return fetch(`${BASE_URL}/paypal/rest/order/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchaseUnits: [
            {
              reference_id: "asdf",
              description: "qwerty",
              amount: {
                currency_code: "USD",
                value: "78.50",
              },
              // crypto.randomUUID() which is usually used to generate a UUID isn't available on Chrome on Android
              // invoice_id: crypto.randomUUID(),
              invoice_id: "10000000-1000-4000-8000-100000000000".replace(
                /[018]/g,
                (c) =>
                  (
                    +c ^
                    (crypto.getRandomValues(new Uint8Array(1))[0] &
                      (15 >> (+c / 4)))
                  ).toString(16)
              ),
            },
          ],
          paymentSource: {
            paypal: {
              experience_context: {
                user_action: "PAY_NOW",
                // use 10.0.2.2 URL when using localhost/10.0.2.2, use playgroundappswitch.infinityfreeapp.com when hosting this on the web domain
                return_url:
                  "http://10.0.2.2:5500/public/paypal/js-sdk/rest/app-switch/index.html",
                cancel_url:
                  "http://10.0.2.2:5500/public/paypal/js-sdk/rest/app-switch/index.html",
                // return_url:
                //   "https://playgroundappswitch.infinityfreeapp.com/paypal/index.html",
                // cancel_url:
                //   "https://playgroundappswitch.infinityfreeapp.com/paypal/index.html",
                app_switch_preference: {
                  launch_paypal_app: true,
                },
              },
            },
          },
          merchantCountry: "US",
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
          merchantCountry: "US",
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

  if (buttons.hasReturned()) {
    console.log("Received buttons returned callback");
    buttons.resume();
  } else {
    buttons.render("#container");
  }
}

main();
