import { useState, useEffect } from "react";
import { login } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentImage, setCurrentImage] = useState(0);

  const images = [
    "/login1.png",
    "/login2.png",
    "/login3.png",
    "/login4.png"
  ];

  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.email || !form.password) {
      setError("Todos los campos son obligatorios");
      return;
    }

    setLoading(true);

    try {
      const res = await login(form);
      localStorage.setItem("token", res.data.token);
      navigate("/offers");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Error al iniciar sesión";

      setError(message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex">

      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-4">

        <div className="bg-red-600 border-2 border-black w-full max-w-md rounded-t-xl p-6 flex flex-col items-center">

          <img src="/logo.png" alt="logo" className="h-12 mb-2" />

          <h1 className="text-2xl font-bold text-white">
            La Cuponera
          </h1>
        </div>

        <div className="w-full max-w-md border-2 border-black rounded-b-xl p-6 shadow-md">

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="email"
              name="email"
              placeholder="Correo"
              onChange={handleChange}
              className="w-full p-2 border border-black rounded text-black"
            />

            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              onChange={handleChange}
              className="w-full p-2 border border-black rounded text-black"
            />

            <button
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded"
            >
              {loading ? "Cargando..." : "Iniciar sesión"}
            </button>

          </form>

          {error && (
            <p className="text-red-500 text-center mt-3">
              {error}
            </p>
          )}

          <p className="text-center mt-4 text-black">
            ¿No tienes cuenta?
          </p>

          <Link to="/register">
            <button className="w-full mt-2 bg-black text-white py-2 rounded">
              Registrarse
            </button>
          </Link>

        </div>
      </div>

      <div className="hidden md:flex w-1/2 h-screen items-center justify-center bg-white">
        <div className="w-[90%] h-[60%] overflow-hidden rounded-xl shadow-lg">
          <img
            src={images[currentImage]}
            alt="banner"
            className="w-full h-full object-cover transition-all duration-700"
          />
        </div>
      </div>

    </div>
  );
}

export default Login;