import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function ChangePassword() {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (
      !form.current_password ||
      !form.new_password ||
      !form.new_password_confirmation
    ) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (form.new_password !== form.new_password_confirmation) {
      setError("Las contraseñas no coinciden");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const res = await api.post(
        "/change-password",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(res.data.message);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Error al cambiar contraseña";

      setError(msg);
    }
  };

  return (
    <>
      <Navbar />

      <div className="mt-[100px] min-h-screen bg-white flex items-center justify-center">

        <div className="w-full max-w-md mx-auto px-4">

          <div className="bg-red-600 border-2 border-black rounded-t-xl p-6 flex flex-col items-center">

            <h1 className="text-2xl font-bold text-white text-center">
              Cambiar Contraseña
            </h1>
          </div>

          <div className="border-2 border-black rounded-b-xl p-6 shadow-md bg-white">

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                type="password"
                name="current_password"
                placeholder="Contraseña actual"
                onChange={handleChange}
                className="w-full p-2 border border-black rounded text-black"
              />

              <input
                type="password"
                name="new_password"
                placeholder="Nueva contraseña"
                onChange={handleChange}
                className="w-full p-2 border border-black rounded text-black"
              />

              <input
                type="password"
                name="new_password_confirmation"
                placeholder="Confirmar contraseña"
                onChange={handleChange}
                className="w-full p-2 border border-black rounded text-black"
              />

              <button className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
                Cambiar contraseña
              </button>

            </form>

            {message && (
              <p className="text-green-600 text-center mt-3">
                {message}
              </p>
            )}

            {error && (
              <p className="text-red-500 text-center mt-3">
                {error}
              </p>
            )}

            <button
              onClick={() => navigate("/offers")}
              className="w-full mt-3 bg-black text-white py-2 rounded hover:bg-gray-800"
            >
              Volver
            </button>

          </div>

        </div>

      </div>
    </>
  );
}

export default ChangePassword;