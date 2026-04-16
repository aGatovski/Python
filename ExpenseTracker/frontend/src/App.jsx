import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard    from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget       from './pages/Budget';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#1a1a2e' }}>
        {/*
          style={{ ... }} passes a JavaScript object as inline CSS.
          The outer {} is JSX expression syntax (embed JS inside JSX).
          The inner {} is the JavaScript object literal.
          CSS property names use camelCase: 'background-color' becomes 'backgroundColor'.
        */}
        <NavLink to="/"             style={({ isActive }) => ({ color: isActive ? '#e94560' : 'white' })}>
          Dashboard
        </NavLink>
        <NavLink to="/transactions" style={({ isActive }) => ({ color: isActive ? '#e94560' : 'white' })}>
          Transactions
        </NavLink>
        <NavLink to="/budget"       style={({ isActive }) => ({ color: isActive ? '#e94560' : 'white' })}>
          Budget
        </NavLink>
        {/*
          NavLink passes { isActive } to the style function.
          isActive is true when the current URL matches the 'to' prop.
          Ternary operator: condition ? valueIfTrue : valueIfFalse
          So: active link is red (#e94560), inactive links are white.
        */}
      </nav>

      <main style={{ padding: '1.5rem' }}>
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budget"       element={<Budget />} />
        </Routes>
        {/*
          Routes looks at the current URL and renders the matching element.
          element={<Dashboard />} means: render the Dashboard component.
          Only one Route renders at a time.
        */}
      </main>
    </BrowserRouter>
  );
}

export default App;
// export default makes App the default export of this file.
// main.jsx imports it with: import App from './App'