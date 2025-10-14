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
  if ((paypal.Fastlane ?? null) === null) {
    console.error("No Fastlane method with associated paypal object");
    document.getElementById("feedback").innerHTML = "Error loading scripts";
    document.getElementById("error").innerHTML =
      "No Fastlane method with associated paypal object";
    return;
  }

  // eslint-disable-next-line no-undef
  paypal
    .Fastlane()
    .then((fastlane) => {
      if ((fastlane ?? null) === null) {
        throw new Error("No fastlane object with associated fastlane");
      }
      if ((fastlane.identity ?? null) === null) {
        throw new Error(
          "No identity attribute with associated fastlane object"
        );
      }
      if ((fastlane.identity.lookupCustomerByEmail ?? null) === null) {
        throw new Error(
          "No lookupCustomerByEmail method with associated fastlane.identity object"
        );
      }
      if ((fastlane.identity.triggerAuthenticationFlow ?? null) === null) {
        throw new Error(
          "No triggerAuthenticationFlow method with associated fastlane.identity object"
        );
      }
      if ((fastlane.profile ?? null) === null) {
        throw new Error("No profile attribute with associated fastlane object");
      }
      if ((fastlane.profile.showShippingAddressSelector ?? null) === null) {
        throw new Error(
          "No showShippingAddressSelector method with associated fastlane.profile object"
        );
      }
      if ((fastlane.FastlanePaymentComponent ?? null) === null) {
        throw new Error(
          "No FastlanePaymentComponent method with associated fastlane object"
        );
      }
      if ((fastlane.FastlaneWatermarkComponent ?? null) === null) {
        throw new Error(
          "No FastlaneWatermarkComponent method with associated fastlane object"
        );
      }

      return [
        fastlane.identity,
        fastlane.profile,
        fastlane.FastlanePaymentComponent,
        fastlane.FastlaneWatermarkComponent,
      ];
    })
    .then(
      ([
        identity,
        profile,
        fastlanePaymentComponent,
        fastlaneWatermarkComponent,
      ]) => {
        Promise.all([
          identity,
          profile,
          fastlanePaymentComponent,
          fastlaneWatermarkComponent({
            includeAdditionalInfo: true,
          }),
        ])
          .then(
            ([
              identity,
              profile,
              fastlanePaymentComponent,
              fastlaneWatermarkComponent,
            ]) => {
              if ((fastlaneWatermarkComponent ?? null) === null) {
                throw new Error(
                  "No fastlaneWatermarkComponent object with associated fastlane watermark component"
                );
              }
              if ((fastlaneWatermarkComponent.render ?? null) === null) {
                throw new Error(
                  "No render method with associated fastlaneWatermarkComponent object"
                );
              }

              console.log("Rendering fastlane watermark");
              fastlaneWatermarkComponent.render("#watermark-container");

              let customerAuthenticated = false;
              let fastlanePaymentComponentInstance = null;

              document
                .getElementById("email-continue-button")
                .addEventListener("click", () => {
                  customerAuthenticated = false;

                  const email = document.getElementById("email").value;
                  console.log(`Received email: ${email}`);

                  if (!email) {
                    console.error("Invalid email");
                    document.getElementById("feedback").innerHTML =
                      "Invalid email";
                    document.getElementById("error").innerHTML = "";
                    return;
                  }

                  console.log("Looking up customer email");
                  identity
                    .lookupCustomerByEmail(email)
                    .then(async (customer) => {
                      if ((customer ?? null) === null) {
                        throw new Error(
                          "No customer object with associated customer"
                        );
                      }

                      if (!customer.customerContextId) {
                        console.log("Customer email not found");
                        document.getElementById("feedback").innerHTML =
                          "Customer email not found";
                        document.getElementById("error").innerHTML = "";
                      } else {
                        console.log(
                          `Found customer with context ID: ${customer.customerContextId}`
                        );
                        document.getElementById(
                          "feedback"
                        ).innerHTML = `Found customer with context ID: ${customer.customerContextId}`;
                        document.getElementById("error").innerHTML = "";

                        console.log("Authenticating known customer");
                        await identity
                          .triggerAuthenticationFlow(customer.customerContextId)
                          .then(async (authResponse) => {
                            if ((authResponse ?? null) === null) {
                              throw new Error(
                                "No authResponse object with associated authentication response"
                              );
                            }
                            if (
                              (authResponse.authenticationState ?? null) ===
                              null
                            ) {
                              throw new Error(
                                "No authenticationState attribute with associated authResponse object"
                              );
                            }

                            switch (authResponse.authenticationState) {
                              case "succeeded": {
                                customerAuthenticated = true;

                                console.log(
                                  "Customer authentication succeeded"
                                );
                                document.getElementById("feedback").innerHTML =
                                  "Customer authentication succeeded";
                                document.getElementById("error").innerHTML = "";

                                if (
                                  (authResponse.profileData ?? null) === null
                                ) {
                                  throw new Error(
                                    "No profileData attribute with associated authResponse object"
                                  );
                                }

                                let firstName =
                                  authResponse.profileData?.shippingAddress
                                    ?.name?.firstName || "";
                                let lastName =
                                  authResponse.profileData?.shippingAddress
                                    ?.name?.lastName || "";
                                let addressLine1 =
                                  authResponse.profileData?.shippingAddress
                                    ?.address?.addressLine1 || "";
                                let addressLine2 =
                                  authResponse.profileData?.shippingAddress
                                    ?.address?.addressLine2 || "";
                                let adminArea1 =
                                  authResponse.profileData?.shippingAddress
                                    ?.address?.adminArea1 || "";
                                let adminArea2 =
                                  authResponse.profileData?.shippingAddress
                                    ?.address?.adminArea2 || "";
                                let postCode =
                                  authResponse.profileData?.shippingAddress
                                    ?.address?.postalCode || "";
                                let country =
                                  authResponse.profileData?.shippingAddress
                                    ?.address?.countryCode || "";
                                let countryCode =
                                  authResponse.profileData?.shippingAddress
                                    ?.phoneNumber?.countryCode || "";
                                let nationalNumber =
                                  authResponse.profileData?.shippingAddress
                                    ?.phoneNumber?.nationalNumber || "";
                                await profile
                                  .showShippingAddressSelector()
                                  .then((shippingAddressSelection) => {
                                    if (
                                      (shippingAddressSelection ?? null) ===
                                      null
                                    ) {
                                      throw new Error(
                                        "No shippingAddressSelection object with associated selected shipping address data"
                                      );
                                    }
                                    if (
                                      (shippingAddressSelection.selectedAddress ??
                                        null) === null
                                    ) {
                                      throw new Error(
                                        "No selectedAddress attribute with associated shippingAddressSelection object, or no shipping address chosen by user"
                                      );
                                    }

                                    return shippingAddressSelection.selectedAddress;
                                  })
                                  .then((shippingInformation) => {
                                    // if any of name, address or phone number have the minimum needed fields, then overwrite the default given shipping information with all of the selected shipping information
                                    if (
                                      (shippingInformation?.name?.firstName &&
                                        shippingInformation?.name?.lastName) ||
                                      (shippingInformation?.address
                                        ?.addressLine1 &&
                                        shippingInformation?.address
                                          ?.adminArea2 &&
                                        shippingInformation?.address
                                          ?.postalCode &&
                                        shippingInformation?.address
                                          ?.countryCode) ||
                                      (shippingInformation?.phoneNumber
                                        ?.countryCode &&
                                        shippingInformation?.phoneNumber
                                          ?.nationalNumber)
                                    ) {
                                      firstName =
                                        shippingInformation?.name?.firstName ||
                                        "";
                                      lastName =
                                        shippingInformation?.name?.lastName ||
                                        "";
                                      addressLine1 =
                                        shippingInformation?.address
                                          ?.addressLine1 || "";
                                      addressLine2 =
                                        shippingInformation?.address
                                          ?.addressLine2 || "";
                                      adminArea1 =
                                        shippingInformation?.address
                                          ?.adminArea1 || "";
                                      adminArea2 =
                                        shippingInformation?.address
                                          ?.adminArea2 || "";
                                      postCode =
                                        shippingInformation?.address
                                          ?.postalCode || "";
                                      country =
                                        shippingInformation?.address
                                          ?.countryCode || "";
                                      countryCode =
                                        shippingInformation?.phoneNumber
                                          ?.countryCode || "";
                                      nationalNumber =
                                        shippingInformation?.phoneNumber
                                          ?.nationalNumber || "";
                                    }
                                  })
                                  .catch((error) => {
                                    console.error(error);
                                    document.getElementById(
                                      "feedback"
                                    ).innerHTML =
                                      "Error getting shipping address from fastlane shipping address selector";
                                    document.getElementById("error").innerHTML =
                                      error.message;
                                  })
                                  .finally(() => {
                                    console.log("Setting shipping address");
                                    document.getElementById(
                                      "first-name"
                                    ).value = firstName;
                                    document.getElementById("last-name").value =
                                      lastName;
                                    document.getElementById(
                                      "address-line-1"
                                    ).value = addressLine1;
                                    document.getElementById(
                                      "address-line-2"
                                    ).value = addressLine2;
                                    document.getElementById("city").value =
                                      adminArea2;
                                    document.getElementById("county").value =
                                      adminArea1;
                                    document.getElementById("post-code").value =
                                      postCode;
                                    document.getElementById("country").value =
                                      country;
                                    document.getElementById(
                                      "country-code"
                                    ).value = countryCode;
                                    document.getElementById(
                                      "national-number"
                                    ).value = nationalNumber;
                                  });
                                break;
                              }
                              case "failed": {
                                console.log("Customer authentication failed");
                                document.getElementById("feedback").innerHTML =
                                  "Customer authentication failed";
                                document.getElementById("error").innerHTML = "";
                                break;
                              }
                              case "canceled": {
                                console.log(
                                  "Customer authentication cancelled"
                                );
                                document.getElementById("feedback").innerHTML =
                                  "Customer authentication cancelled";
                                document.getElementById("error").innerHTML = "";
                                break;
                              }
                              case "not_found": {
                                console.log("Customer not found");
                                document.getElementById("feedback").innerHTML =
                                  "Customer not found";
                                document.getElementById("error").innerHTML = "";
                                break;
                              }
                              default: {
                                throw new Error(
                                  `Unknown authentication state: ${authResponse.authenticationState}`
                                );
                              }
                            }
                          })
                          .catch((error) => {
                            console.error(error);
                            document.getElementById("feedback").innerHTML =
                              "Error authenticating known customer";
                            document.getElementById("error").innerHTML =
                              error.message;
                          });
                      }
                    })
                    .catch((error) => {
                      console.error(error);
                      document.getElementById("feedback").innerHTML =
                        "Error looking up customer";
                      document.getElementById("error").innerHTML =
                        error.message;
                    })
                    .finally(() => {
                      console.log("Enabling shipping fields");
                      document.getElementById("feedback").innerHTML =
                        "Enabling shipping fields";
                      document.getElementById("error").innerHTML = "";

                      document
                        .getElementById("email")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("email-continue-button")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("email-edit-button")
                        .removeAttribute("disabled");
                      document
                        .getElementById("shipping-section")
                        .removeAttribute("hidden");
                      document
                        .getElementById("first-name")
                        .removeAttribute("disabled");
                      document
                        .getElementById("last-name")
                        .removeAttribute("disabled");
                      document
                        .getElementById("address-line-1")
                        .removeAttribute("disabled");
                      document
                        .getElementById("address-line-2")
                        .removeAttribute("disabled");
                      document
                        .getElementById("city")
                        .removeAttribute("disabled");
                      document
                        .getElementById("county")
                        .removeAttribute("disabled");
                      document
                        .getElementById("post-code")
                        .removeAttribute("disabled");
                      document
                        .getElementById("country")
                        .removeAttribute("disabled");
                      document
                        .getElementById("country-code")
                        .removeAttribute("disabled");
                      document
                        .getElementById("national-number")
                        .removeAttribute("disabled");
                      document
                        .getElementById("shipping-continue-button")
                        .removeAttribute("disabled");
                      document
                        .getElementById("shipping-edit-button")
                        .setAttribute("disabled", true);
                    });
                });

              document
                .getElementById("email-edit-button")
                .addEventListener("click", () => {
                  console.log("Disabling shipping and payment fields");
                  document.getElementById("feedback").innerHTML =
                    "Disabling shipping and payment fields";
                  document.getElementById("error").innerHTML = "";

                  document.getElementById("email").removeAttribute("disabled");
                  document
                    .getElementById("email-continue-button")
                    .removeAttribute("disabled");
                  document
                    .getElementById("email-edit-button")
                    .setAttribute("disabled", true);
                  document
                    .getElementById("shipping-section")
                    .setAttribute("hidden", true);
                  document.getElementById("first-name").value = "";
                  document.getElementById("last-name").value = "";
                  document.getElementById("address-line-1").value = "";
                  document.getElementById("address-line-2").value = "";
                  document.getElementById("city").value = "";
                  document.getElementById("county").value = "";
                  document.getElementById("post-code").value = "";
                  document.getElementById("country").value = "";
                  document.getElementById("country-code").value = "";
                  document.getElementById("national-number").value = "";
                  document
                    .getElementById("payment-section")
                    .setAttribute("hidden", true);
                });

              document
                .getElementById("shipping-continue-button")
                .addEventListener("click", () => {
                  fastlanePaymentComponentInstance = null;

                  if (
                    !document.getElementById("first-name").value ||
                    !document.getElementById("last-name").value ||
                    !document.getElementById("address-line-1").value ||
                    !document.getElementById("city").value ||
                    !document.getElementById("post-code").value ||
                    !document.getElementById("country").value ||
                    Boolean(document.getElementById("country-code").value) !==
                      Boolean(document.getElementById("national-number").value)
                  ) {
                    console.error(
                      "Missing required shipping fields or phone number fields are only partially complete"
                    );
                    document.getElementById("feedback").innerHTML =
                      "Error submitting shipping information";
                    document.getElementById("error").innerHTML =
                      "Missing required shipping fields or phone number fields are only partially complete";
                    return;
                  }

                  console.log("Enabling payment fields");
                  document.getElementById("feedback").innerHTML =
                    "Enabling payment fields";
                  document.getElementById("error").innerHTML = "";

                  console.log("Rendering fastlane payment component");
                  fastlanePaymentComponent()
                    .then((fastlanePaymentComponent) => {
                      if ((fastlanePaymentComponent ?? null) === null) {
                        throw new Error(
                          "No fastlanePaymentComponent object with associated fastlane payment component"
                        );
                      }
                      if ((fastlanePaymentComponent.render ?? null) === null) {
                        throw new Error(
                          "No render method with associated fastlanePaymentComponent object"
                        );
                      }
                      if (
                        (fastlanePaymentComponent.setShippingAddress ??
                          null) === null
                      ) {
                        throw new Error(
                          "No setShippingAddress method with associated fastlanePaymentComponent object"
                        );
                      }
                      if (
                        (fastlanePaymentComponent.getPaymentToken ?? null) ===
                        null
                      ) {
                        throw new Error(
                          "No getPaymentToken method with associated fastlanePaymentComponent object"
                        );
                      }

                      return fastlanePaymentComponent;
                    })
                    .then((fastlanePaymentComponent) => {
                      fastlanePaymentComponentInstance =
                        fastlanePaymentComponent;

                      fastlanePaymentComponent.render("#payment-container");

                      console.log("Setting shipping address");
                      fastlanePaymentComponent
                        .setShippingAddress({
                          address: {
                            addressLine1:
                              document.getElementById("address-line-1").value,
                            addressLine2:
                              document.getElementById("address-line-2").value ||
                              undefined,
                            adminArea1:
                              document.getElementById("county").value ||
                              undefined,
                            adminArea2: document.getElementById("city").value,
                            postalCode:
                              document.getElementById("post-code").value,
                            countryCode:
                              document.getElementById("country").value,
                          },
                          name: {
                            firstName:
                              document.getElementById("first-name").value,
                            lastName:
                              document.getElementById("last-name").value,
                            fullName: `${
                              document.getElementById("first-name").value
                            } ${document.getElementById("last-name").value}`,
                          },
                          phoneNumber: {
                            countryCode:
                              document.getElementById("country-code").value ||
                              undefined,
                            nationalNumber:
                              document.getElementById("national-number")
                                .value || undefined,
                          },
                        })
                        .then(() => {
                          console.log("Shipping address set successfully");
                          document.getElementById("feedback").innerHTML =
                            "Shipping address set successfully";
                          document.getElementById("error").innerHTML = "";
                        })
                        .catch((error) => {
                          console.error(error);
                          document.getElementById("feedback").innerHTML =
                            "Error setting shipping address";
                          document.getElementById("error").innerHTML =
                            error.message;
                        });
                    })
                    .finally(() => {
                      document
                        .getElementById("first-name")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("last-name")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("address-line-1")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("address-line-2")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("city")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("county")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("post-code")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("country")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("country-code")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("national-number")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("shipping-continue-button")
                        .setAttribute("disabled", true);
                      document
                        .getElementById("shipping-edit-button")
                        .removeAttribute("disabled");
                      document
                        .getElementById("payment-section")
                        .removeAttribute("hidden");
                      document
                        .getElementById("submit-button")
                        .removeAttribute("disabled");
                    });
                });

              document
                .getElementById("shipping-edit-button")
                .addEventListener("click", async () => {
                  if (customerAuthenticated) {
                    await profile
                      .showShippingAddressSelector()
                      .then((shippingAddressSelection) => {
                        if ((shippingAddressSelection ?? null) === null) {
                          throw new Error(
                            "No shippingAddressSelection object with associated selected shipping address data"
                          );
                        }
                        if (
                          (shippingAddressSelection.selectedAddress ?? null) ===
                          null
                        ) {
                          throw new Error(
                            "No selectedAddress attribute with associated shippingAddressSelection object, or no shipping address chosen by user"
                          );
                        }

                        return shippingAddressSelection.selectedAddress;
                      })
                      .then((shippingInformation) => {
                        // if any of name, address or phone number have the minimum needed fields, then overwrite the previously given shipping information with all of the selected shipping information
                        if (
                          (shippingInformation?.name?.firstName &&
                            shippingInformation?.name?.lastName) ||
                          (shippingInformation?.address?.addressLine1 &&
                            shippingInformation?.address?.adminArea2 &&
                            shippingInformation?.address?.postalCode &&
                            shippingInformation?.address?.countryCode) ||
                          (shippingInformation?.phoneNumber?.countryCode &&
                            shippingInformation?.phoneNumber?.nationalNumber)
                        ) {
                          console.log("Setting shipping address");
                          document.getElementById("first-name").value =
                            shippingInformation?.name?.firstName || "";
                          document.getElementById("last-name").value =
                            shippingInformation?.name?.lastName || "";
                          document.getElementById("address-line-1").value =
                            shippingInformation?.address?.addressLine1 || "";
                          document.getElementById("address-line-2").value =
                            shippingInformation?.address?.addressLine2 || "";
                          document.getElementById("city").value =
                            shippingInformation?.address?.adminArea2 || "";
                          document.getElementById("county").value =
                            shippingInformation?.address?.adminArea1 || "";
                          document.getElementById("post-code").value =
                            shippingInformation?.address?.postalCode || "";
                          document.getElementById("country").value =
                            shippingInformation?.address?.countryCode || "";
                          document.getElementById("country-code").value =
                            shippingInformation?.phoneNumber?.countryCode || "";
                          document.getElementById("national-number").value =
                            shippingInformation?.phoneNumber?.nationalNumber ||
                            "";
                        }
                      })
                      .catch((error) => {
                        console.error(error);
                        document.getElementById("feedback").innerHTML =
                          "Error getting shipping address from fastlane shipping address selector";
                        document.getElementById("error").innerHTML =
                          error.message;
                      });
                  }

                  console.log("Disabling payment fields");
                  document.getElementById("feedback").innerHTML =
                    "Disabling payment fields";
                  document.getElementById("error").innerHTML = "";

                  document
                    .getElementById("first-name")
                    .removeAttribute("disabled");
                  document
                    .getElementById("last-name")
                    .removeAttribute("disabled");
                  document
                    .getElementById("address-line-1")
                    .removeAttribute("disabled");
                  document
                    .getElementById("address-line-2")
                    .removeAttribute("disabled");
                  document.getElementById("city").removeAttribute("disabled");
                  document.getElementById("county").removeAttribute("disabled");
                  document
                    .getElementById("post-code")
                    .removeAttribute("disabled");
                  document
                    .getElementById("country")
                    .removeAttribute("disabled");
                  document
                    .getElementById("country-code")
                    .removeAttribute("disabled");
                  document
                    .getElementById("national-number")
                    .removeAttribute("disabled");
                  document
                    .getElementById("shipping-continue-button")
                    .removeAttribute("disabled");
                  document
                    .getElementById("shipping-edit-button")
                    .setAttribute("disabled", true);
                  document
                    .getElementById("payment-section")
                    .setAttribute("hidden", true);
                });

              document
                .getElementById("submit-button")
                .addEventListener("click", () => {
                  console.log("Getting payment token");
                  fastlanePaymentComponentInstance
                    .getPaymentToken()
                    .then((paymentToken) => {
                      if ((paymentToken ?? null) === null) {
                        throw new Error(
                          "No paymentToken object with associated payment token"
                        );
                      }
                      if ((paymentToken.id ?? null) === null) {
                        throw new Error(
                          "No id attribute with associated paymentToken object"
                        );
                      }

                      return paymentToken.id;
                    })
                    .then((paymentTokenId) => {
                      console.log(
                        `Successfully received payment token ID: ${paymentTokenId}`
                      );
                      document.getElementById(
                        "feedback"
                      ).innerHTML = `Successfully received payment token ID ${paymentTokenId}`;
                      document.getElementById("error").innerHTML = "";

                      let purchaseUnits = [
                        {
                          reference_id: "asdf",
                          description: "qwerty",
                          amount: {
                            currency_code: "GBP",
                            value: "78.50",
                          },
                          shipping: {},
                          invoice_id: crypto.randomUUID(),
                        },
                      ];
                      if (
                        document.getElementById("first-name").value &&
                        document.getElementById("last-name").value
                      ) {
                        purchaseUnits[0].shipping.name = {
                          full_name: `${
                            document.getElementById("first-name").value
                          } ${document.getElementById("last-name").value}`,
                        };
                      }
                      if (
                        document.getElementById("address-line-1").value &&
                        document.getElementById("city").value &&
                        document.getElementById("post-code").value &&
                        document.getElementById("country").value
                      ) {
                        purchaseUnits[0].shipping.address = {
                          address_line_1:
                            document.getElementById("address-line-1").value,
                          admin_area_2: document.getElementById("city").value,
                          postal_code:
                            document.getElementById("post-code").value,
                          country_code:
                            document.getElementById("country").value,
                        };

                        if (document.getElementById("address-line-2").value) {
                          purchaseUnits[0].shipping.address.address_line_2 =
                            document.getElementById("address-line-2").value;
                        }
                        if (document.getElementById("county").value) {
                          purchaseUnits[0].shipping.address.admin_area_1 =
                            document.getElementById("county").value;
                        }
                      }
                      if (
                        document.getElementById("country-code").value &&
                        document.getElementById("national-number").value
                      ) {
                        purchaseUnits[0].shipping.phone_number = {
                          country_code:
                            document.getElementById("country-code").value,
                          national_number:
                            document.getElementById("national-number").value,
                        };
                      }

                      console.log("Creating and capturing order");
                      fetch(`${BASE_URL}/paypal/rest/order/new`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          intent: "CAPTURE",
                          purchaseUnits: purchaseUnits,
                          paymentSource: {
                            card: {
                              single_use_token: paymentTokenId,
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
                            throw new Error(
                              "No order ID with associated created and captured order"
                            );
                          }

                          return data.id;
                        })
                        .then((orderId) => {
                          console.log(
                            `Order with ID ${orderId} successfully created and captured`
                          );
                          document.getElementById(
                            "feedback"
                          ).innerHTML = `Order with ID ${orderId} successfully created and captured`;
                          document.getElementById("error").innerHTML = "";
                        })
                        .then(() => {
                          console.log("Disabling shipping and payment fields");
                          document.getElementById("feedback").innerHTML =
                            "Disabling shipping and payment fields";
                          document.getElementById("error").innerHTML = "";

                          document
                            .getElementById("email")
                            .removeAttribute("disabled");
                          document
                            .getElementById("email-continue-button")
                            .removeAttribute("disabled");
                          document
                            .getElementById("email-edit-button")
                            .setAttribute("disabled", true);
                          document
                            .getElementById("shipping-section")
                            .setAttribute("hidden", true);
                          document.getElementById("first-name").value = "";
                          document.getElementById("last-name").value = "";
                          document.getElementById("address-line-1").value = "";
                          document.getElementById("address-line-2").value = "";
                          document.getElementById("city").value = "";
                          document.getElementById("county").value = "";
                          document.getElementById("post-code").value = "";
                          document.getElementById("country").value = "";
                          document.getElementById("country-code").value = "";
                          document.getElementById("national-number").value = "";
                          document
                            .getElementById("payment-section")
                            .setAttribute("hidden", true);
                        })
                        .catch((error) => {
                          console.error(error);
                          document.getElementById("feedback").innerHTML =
                            "Error creating and capturing order";
                          document.getElementById("error").innerHTML = "";
                        });
                    })
                    .catch((error) => {
                      console.error(error);
                      document.getElementById("feedback").innerHTML =
                        "Error getting payment token";
                      document.getElementById("error").innerHTML =
                        error.message;
                    });
                });
            }
          )
          .catch((error) => {
            console.error(error);
            document.getElementById("feedback").innerHTML =
              "Error initialising fastlane components";
            document.getElementById("error").innerHTML = error.message;
          });
      }
    )
    .catch((error) => {
      console.error(error);
      document.getElementById("feedback").innerHTML =
        "Error initialising fastlane";
      document.getElementById("error").innerHTML = error.message;
    });
}

main();
