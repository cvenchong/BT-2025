import { PayPalButtons } from "@paypal/react-paypal-js";

const Buttons = () => {
  console.log(window.paypal);
  console.log(window.paypal?.getFundingSources());
  console.log(
    window.paypal?.isFundingEligible(window.paypal?.FUNDING?.PAYLATER)
  );

  const test = () => {
    console.log(window.paypal);
    console.log(window.paypal?.getFundingSources());
    console.log(
      window.paypal?.isFundingEligible(window.paypal?.FUNDING?.PAYLATER)
    );
  };

  return (
    <>
      <PayPalButtons fundingSource="paypal" />
      <PayPalButtons
        fundingSource="paylater"
        style={{
          color: "gold",
        }}
      />
      <button
        onClick={() => {
          test();
        }}
      >
        Test
      </button>
    </>
  );
};

export default Buttons;
