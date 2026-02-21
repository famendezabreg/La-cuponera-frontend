import { useState } from "react";
import { register } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Register() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    dui: ""
  });

  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    setErrors({});

    if (
      !form.first_name ||
      !form.last_name ||
      !form.email ||
      !form.password ||
      !form.phone ||
      !form.address ||
      !form.dui
    ) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (!/^\d{7,15}$/.test(form.phone)) {
      setError("El teléfono debe tener entre 7 y 15 dígitos");
      return;
    }

    if (!/^\d{9}$/.test(form.dui)) {
      setError("El DUI debe tener 9 dígitos");
      return;
    }

    setLoading(true);

    try {
      await register(form);
      navigate("/");
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError("Error al registrarse");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center">

      <div className="w-full max-w-md px-4">

        <div className="bg-red-600 border-2 border-black rounded-t-xl p-6 flex flex-col items-center">

          <img
            src="/logo.png"
            alt="logo"
            className="h-12 mb-2"
          />

          <h1 className="text-2xl font-bold text-white text-center">
            Registro
          </h1>
        </div>

        <div className="border-2 border-black rounded-b-xl p-6 shadow-md bg-white">

          <form onSubmit={handleSubmit} className="space-y-3">

            <input name="first_name" placeholder="Nombres" onChange={handleChange} className="w-full p-2 border border-black rounded text-black" />
            <p className="text-red-500 text-sm">{errors.first_name?.[0]}</p>

            <input name="last_name" placeholder="Apellidos" onChange={handleChange} className="w-full p-2 border border-black rounded text-black" />
            <p className="text-red-500 text-sm">{errors.last_name?.[0]}</p>

            <input name="email" placeholder="Correo" onChange={handleChange} className="w-full p-2 border border-black rounded text-black" />
            <p className="text-red-500 text-sm">{errors.email?.[0]}</p>

            <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} className="w-full p-2 border border-black rounded text-black" />
            <p className="text-red-500 text-sm">{errors.password?.[0]}</p>

            <input name="phone" placeholder="Teléfono" onChange={handleChange} className="w-full p-2 border border-black rounded text-black" />
            <p className="text-red-500 text-sm">{errors.phone?.[0]}</p>

            <input name="address" placeholder="Dirección" onChange={handleChange} className="w-full p-2 border border-black rounded text-black" />
            <p className="text-red-500 text-sm">{errors.address?.[0]}</p>

            <input name="dui" placeholder="DUI" onChange={handleChange} className="w-full p-2 border border-black rounded text-black" />
            <p className="text-red-500 text-sm">{errors.dui?.[0]}</p>

            <button
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
            >
              {loading ? "Cargando..." : "Registrarse"}
            </button>

          </form>

          {error && (
            <p className="text-red-500 text-center mt-3">
              {error}
            </p>
          )}

          <button
            onClick={() => navigate("/")}
            className="w-full mt-3 bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            Cancelar
          </button>

        </div>

      </div>

    </div>
  );
}

export default Register;