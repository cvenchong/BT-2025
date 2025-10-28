export default function Confirm() {
  const url = new URL(window.location.href);
  const key = url.searchParams.get('ppKey');
  const raw = key ? sessionStorage.getItem(key) : null;
  return (
    <>
      <h2>Confirm</h2>
      <p>Data recovered from interstitial (if any):</p>
      <pre>{raw || '(no ppKey data found)'}</pre>
    </>
  );
}
