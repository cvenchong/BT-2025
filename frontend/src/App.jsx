import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Checkout from './pages/Checkout.jsx';
import Confirm from './pages/Confirm.jsx';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: 16 }}>
      <h1>BT App Switch × Hash Router Demo</h1>
      <nav style={{ marginBottom: 12 }}>
        <Link to="/home">Home</Link>{' | '}
        <Link to="/checkout">Checkout</Link>
      </nav>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirm" element={<Confirm />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}
