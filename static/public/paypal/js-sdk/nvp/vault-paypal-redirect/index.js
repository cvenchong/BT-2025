const BASE_URL = "http://localhost:8888";
const ORDER_AMOUNT = "25.00";
const CURRENCY = "GBP";

document.getElementById("submit-button").addEventListener("click", async () => {
  console.log("Reading query parameters");
  let queryParams = new URLSearchParams(window.location.search);
  if (queryParams.has("billing-agreement-id")) {
    let billingAgreementId = queryParams.get("billing-agreement-id");
    console.log(`Using billing agreement ID: ${billingAgreementId}`);

    console.log("Attempting to create order");
    fetch(`${BASE_URL}/paypal/nvp/referenceTransaction/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billingAgreementId: billingAgreementId,
        amount: ORDER_AMOUNT,
        currency: CURRENCY,
      }),
    })
      .then(async (response) => {
        if (response.status === 204) {
          console.log(
            "Reference transaction successfully created and captured"
          );
          document.getElementById("feedback").innerHTML =
            "Reference transaction successfully created and captured";
          document.getElementById("error").innerHTML = "";
        } else {
          throw new Error((await response.json())?.message);
        }
      })
      .catch((error) => {
        console.error(error);
        document.getElementById("feedback").innerHTML =
          "Error creating reference transaction";
        document.getElementById("error").innerHTML = error.message;
      });
  } else {
    console.error("Couldn't read billing agreement ID from query parameters");
    document.getElementById("feedback").innerHTML =
      "Error reading billing agremeent ID";
    document.getElementById("error").innerHTML =
      "Couldn't read billing agreement ID from query parameters";
  }
});
