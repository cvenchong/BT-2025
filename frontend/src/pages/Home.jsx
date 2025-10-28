export default function Home() {
  return (
    <>
      <h2>Home</h2>
      <p>This SPA uses a <b>hash-based</b> router. We’ll demo:</p>
      <ol>
        <li><b>Broken</b>: Return to SPA → router overwrites PayPal’s <code>#fragment</code> → resume fails.</li>
        <li><b>Fixed</b>: Return to <i>interstitial bridge</i> → capture fragment → forward cleanly.</li>
      </ol>
      <p>Go to <b>Checkout</b> and switch modes.</p>
    </>
  );
}
