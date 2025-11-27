const BASE_URL = "http://localhost:8888";

const OPTIONS = ["25.00", "12.50", "5.00", "3.00", "67.25", "137.75"];

function countTotal() {
  let checkboxes = document.getElementsByClassName("option");
  let total = 0;
  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes.item(i).checked) {
      total += Number(checkboxes.item(i).getAttribute("data-value"));
    }
  }
  return total;
}

function updateTotal() {
  let total = countTotal();
  document.getElementById("total").innerHTML = `Total: £${total.toFixed(2)}`;
  document
    .getElementById("message-container")
    .setAttribute("data-pp-amount", total.toFixed(2));
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

  // initialise options
  let option_container = document.getElementById("options-container");
  for (let i = 0; i < OPTIONS.length; i++) {
    let div = document.createElement("div");
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `option-${i}`;
    checkbox.className = "option";
    checkbox.setAttribute("data-value", `${OPTIONS[i]}`);
    checkbox.addEventListener("click", updateTotal);
    div.appendChild(checkbox);
    let text = document.createElement("label");
    text.setAttribute("for", `option-${i}`);
    text.innerHTML = `£${OPTIONS[i]}`;
    div.appendChild(text);
    option_container.appendChild(div);
  }
  updateTotal();

  // eslint-disable-next-line no-undef
  paypal
    .Buttons({
      async createOrder() {
        console.log("Received order creation request");

        const purchaseUnits = [
          {
            reference_id: "asdf",
            description: "qwerty",
            amount: {
              currency_code: "GBP",
              value: countTotal().toFixed(2),
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
