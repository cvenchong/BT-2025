const BASE_URL = "http://localhost:8888";

console.log("Received initial render request");

console.log("Attempting to get ID token");
fetch(`${BASE_URL}/paypal/rest/auth/id`, {
  method: "POST",
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
      throw new Error("No token with associated ID token");
    }

    return data.token;
  })
  .then((IdToken) => {
    console.log(`ID token successfully obtained: ${IdToken}`);
    document.getElementById(
      "feedback"
    ).innerHTML = `ID token successfully obtained: ${IdToken}`;
    document.getElementById("error").innerHTML = "";

    let sdk = document.createElement("script");
    sdk.src =
      "https://www.paypal.com/sdk/js?client-id=AUivjUL_LNyZFzHIU9lbQ9-egUXMZUkqREhl9bDpr25-BOnu_G2qKRwLpzYNI7Oukqo-Az_danXFAXT6&components=buttons&currency=GBP&buyer-country=GB&disable-funding=card&vault=true";
    sdk.setAttribute("data-user-id-token", IdToken);
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
