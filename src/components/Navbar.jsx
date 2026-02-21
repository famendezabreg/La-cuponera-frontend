import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="fixed top-0 left-0 w-full bg-red-600 text-white z-50">

      <div className="flex justify-between items-center px-6 py-3">

        <div className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="logo"
            className="h-10 cursor-pointer"
            onClick={() => navigate("/offers")}
          />
          <h1
            className="text-xl font-bold cursor-pointer"
            onClick={() => navigate("/offers")}
          >
            La Cuponera
          </h1>
        </div>

        <div className="hidden md:flex space-x-3">
          <button onClick={() => navigate("/offers")} className="bg-black px-3 py-1 rounded">
            Ofertas
          </button>

          <button onClick={() => navigate("/coupons")} className="bg-black px-3 py-1 rounded">
            Mis cupones
          </button>

          <button onClick={() => navigate("/change-password")} className="bg-black px-3 py-1 rounded">
            Cambiar contraseña
          </button>

          <button onClick={logout} className="bg-black px-3 py-1 rounded">
            Salir
          </button>
        </div>

        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>

      </div>

      {open && (
        <div className="md:hidden flex flex-col items-center bg-red-600 pb-4 space-y-2">

          <button
            onClick={() => { navigate("/offers"); setOpen(false); }}
            className="bg-black w-11/12 py-2 rounded"
          >
            Ofertas
          </button>

          <button
            onClick={() => { navigate("/coupons"); setOpen(false); }}
            className="bg-black w-11/12 py-2 rounded"
          >
            Mis cupones
          </button>

          <button
            onClick={() => { navigate("/change-password"); setOpen(false); }}
            className="bg-black w-11/12 py-2 rounded"
          >
            Cambiar contraseña
          </button>

          <button
            onClick={() => { logout(); setOpen(false); }}
            className="bg-black w-11/12 py-2 rounded"
          >
            Salir
          </button>

        </div>
      )}

    </div>
  );
}

export default Navbar;