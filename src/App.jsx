import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Offers from "./pages/Offers";
import Coupons from "./pages/Coupons";
import ChangePassword from "./pages/ChangePassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/change-password" element={<ChangePassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;