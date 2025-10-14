const merchantAccountId = "stevenchong";
const BASE_URL = "http://127.0.0.1:5000";

function main() {
  // eslint-disable-next-line no-undef
  if ((braintree ?? null) === null) {
    console.error(
      "No braintree object with associated loaded Braintree script"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No braintree object with associated loaded Braintree script";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.client ?? null) === null) {
    console.error("No client attribute with associated braintree object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No client attribute with associated braintree object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.client.create ?? null) === null) {
    console.error("No create method with associated braintree.client object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No create method with associated braintree.client object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.dataCollector ?? null) === null) {
    console.error(
      "No dataCollector attribute with associated braintree object"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No dataCollector attribute with associated braintree object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.dataCollector.create ?? null) === null) {
    console.error(
      "No create method with associated braintree.dataCollector object"
    );
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No create method with associated braintree.dataCollector object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.fastlane ?? null) === null) {
    console.error("No fastlane attribute with associated braintree object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No fastlane attribute with associated braintree object";
    return;
  }
  // eslint-disable-next-line no-undef
  if ((braintree.fastlane.create ?? null) === null) {
    console.error("No create method with associated braintree.fastlane object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No create method with associated braintree.fastlane object";
    return;
  }

  fetch(`${BASE_URL}/braintree/sdk/auth/client`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    merchantAccountId: merchantAccountId,
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
        throw new Error("No client token received");
      }

      return data.token;
    })
    .then((clientToken) => {
      console.log(`Client token successfully obtained: ${clientToken}`);
      document.getElementById(
        "feedback"
      ).innerHTML = `Client token successfully obtained: ${clientToken}`;
      document.getElementById("error").innerHTML = "";

      console.log("Initialising client");

      // eslint-disable-next-line no-undef
      braintree.client
        .create({
          authorization: clientToken,
        })
        .then((client) => {
          if ((client ?? null) === null) {
            throw new Error("No client object with associated client");
          }

          console.log("Initialising data collector");

          // eslint-disable-next-line no-undef
          braintree.dataCollector
            .create({
              client: client,
            })
            .then((dataCollector) => {
              if ((dataCollector ?? null) === null) {
                throw new Error(
                  "No dataCollector object with associated data collector"
                );
              }
              if ((dataCollector.getDeviceData ?? null) === null) {
                throw new Error(
                  "No getDeviceData method with associated dataCollector object"
                );
              }

              console.log("Getting device data information");
              dataCollector
                .getDeviceData()
                .then((deviceData) => {
                  if ((deviceData ?? null) === null) {
                    throw new Error(
                      "No deviceData value with associated device data"
                    );
                  }

                  console.log(JSON.stringify(deviceData, null, 2));

                  console.log("Initialising fastlane");

                  // eslint-disable-next-line no-undef
                  braintree.fastlane
                    .create({
                      authorization: clientToken,
                      client: client,
                      deviceData: deviceData,
                    })
                    .then((fastlane) => {
                      if ((fastlane ?? null) === null) {
                        throw new Error(
                          "No fastlane object with associated fastlane"
                        );
                      }
                      if ((fastlane.identity ?? null) === null) {
                        throw new Error(
                          "No identity attribute with associated fastlane object"
                        );
                      }
                      if ((fastlane.profile ?? null) === null) {
                        throw new Error(
                          "No profile method with associated fastlane object"
                        );
                      }

                      console.log(JSON.stringify(fastlane, null, 2));

                      return [fastlane.identity, fastlane.profile];
                    })
                    .then(([identity, profile]) => {
                      console.log(JSON.stringify(identity, null, 2));
                      console.log(JSON.stringify(profile, null, 2));
                      console.log(identity);
                      console.log(profile);
                    })
                    // .then((nonce) => {
                    //   console.log(
                    //     `Successfully received payment nonce: ${nonce}`
                    //   );

                    //   console.log("Creating transaction");
                    //   return fetch(
                    //     `${BASE_URL}/braintree/sdk/transaction/new`,
                    //     {
                    //       method: "POST",
                    //       headers: {
                    //         "Content-Type": "application/json",
                    //       },
                    //       body: JSON.stringify({
                    //         amount: "10.00",
                    //         paymentMethodNonce: nonce,
                    //         storeInVaultOnSuccess: false,
                    //         submitForSettlement: true,
                    //       }),
                    //     }
                    //   );
                    // })
                    // .then(async (response) => {
                    //   if (response.status === 201) {
                    //     return response.json();
                    //   } else {
                    //     throw new Error((await response.json())?.message);
                    //   }
                    // })
                    // .then((data) => {
                    //   if ((data?.transactionId ?? null) === null) {
                    //     throw new Error(
                    //       "No transaction ID with associated successful transaction"
                    //     );
                    //   }

                    //   return data.transactionId;
                    // })
                    // .then((transactionId) => {
                    //   console.log(
                    //     `Transaction with ID ${transactionId} successfully created and settled`
                    //   );
                    //   document.getElementById(
                    //     "feedback"
                    //   ).innerHTML = `Transaction with ID ${transactionId} successfully created and settled`;
                    //   document.getElementById("error").innerHTML = "";
                    // })
                    .catch((error) => {
                      console.error(error);
                      document.getElementById("feedback").innerHTML =
                        "Error getting device data";
                      document.getElementById("error").innerHTML =
                        error.message;
                    });
                })
                .catch((error) => {
                  console.error(error);
                  document.getElementById("feedback").innerHTML =
                    "Error getting device data";
                  document.getElementById("error").innerHTML = error.message;
                });
            })
            .catch((error) => {
              console.error(error);
              document.getElementById("feedback").innerHTML =
                "Error initialising data collector";
              document.getElementById("error").innerHTML = error.message;
            });
        })
        .catch((error) => {
          console.error(error);
          document.getElementById("feedback").innerHTML =
            "Error initialising client";
          document.getElementById("error").innerHTML = error.message;
        });
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML =
        "Error getting client token";
      document.getElementById("error").innerHTML = error.message;
    });
}

main();
