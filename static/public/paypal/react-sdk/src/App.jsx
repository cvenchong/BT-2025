import { useEffect, useState } from "react";
import "./App.css";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

import BraintreeButtons from "./BraintreeButtons.jsx";
import Buttons from "./Buttons.jsx";

const BASE_URL = "http://localhost:8888";

function App() {
  const [clientToken, setClientToken] = useState(null);

  useEffect(() => {
    (async () => {
      fetch(`${BASE_URL}/braintree/sdk/auth/client`, {
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
          if (!data?.token) {
            throw new Error("No client token received");
          }

          return data.token;
        })
        .then((clientToken) => {
          setClientToken(clientToken);
        });
    })();
  }, []);

  return (
    <>
      {/* <h1>PPCP</h1>
      <PayPalScriptProvider
        options={{
          clientId:
            "AUivjUL_LNyZFzHIU9lbQ9-egUXMZUkqREhl9bDpr25-BOnu_G2qKRwLpzYNI7Oukqo-Az_danXFAXT6",
          enableFunding: "paylater",
          buyerCountry: "GB",
          currency: "GBP",
          components: "buttons,funding-eligibility",
        }}
      >
        <Buttons />
      </PayPalScriptProvider> */}

      <h1>BT</h1>
      {clientToken ? (
        <PayPalScriptProvider
          options={{
            clientId: "test",
            components: "buttons",
            intent: "capture",
            locale: "en_GB",
            buyerCountry: "GB",
            currency: "GBP",
            dataClientToken: clientToken,
            enableFunding: "paylater",
          }}
        >
          <BraintreeButtons />
        </PayPalScriptProvider>
      ) : (
        <p>Loading client token</p>
      )}
    </>
  );
}

export default App;
