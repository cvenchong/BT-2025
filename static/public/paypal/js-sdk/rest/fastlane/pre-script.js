const BASE_URL = "http://localhost:8888";

console.log("Received initial render request");

console.log("Attempting to get client token");
fetch(`${BASE_URL}/paypal/rest/auth/client`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    merchantCountry: "US",
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
      throw new Error("No token with associated client token");
    }

    return data.token;
  })
  .then((clientToken) => {
    console.log(`Client token successfully obtained: ${clientToken}`);
    document.getElementById(
      "feedback"
    ).innerHTML = `Client token successfully obtained: ${clientToken}`;
    document.getElementById("error").innerHTML = "";

    let sdk = document.createElement("script");
    sdk.src =
      "https://www.paypal.com/sdk/js?client-id=AQhRa2L8FwFLTs_f8Fh2dBHLhxBUd461Q2zZ3wxqG8sJfj8uEJz3510sktSL11xXyNzqJmYdltBMQpTj&components=buttons,fastlane&currency=USD&buyer-country=US";
    sdk.setAttribute("data-sdk-client-token", clientToken);
    sdk.type = "module";

    let script = document.createElement("script");
    script.src = "./index.js";
    sdk.type = "module";

    sdk.addEventListener("load", () => {
      document.body.appendChild(script);
    });

    document.head.appendChild(sdk);
  })
  .catch((error) => {
    document.getElementById("feedback").innerHTML = error.message;
    console.error(error);
    return undefined;
  });
