import { useEffect, useState } from "react";
import api from "../services/api";
import { buyCoupon } from "../services/purchaseService";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Offers() {
  const [groupedOffers, setGroupedOffers] = useState({});
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    api.get("/offers")
      .then(res => {
        const offers = res.data.data;
        const grouped = {};

        offers.forEach((offer) => {
          const category =
            offer.company?.category?.name || "Otros";

          if (!grouped[category]) {
            grouped[category] = [];
          }

          grouped[category].push(offer);
        });

        setGroupedOffers(grouped);
      })
      .catch(err => console.log(err));
  }, [navigate]);

  const handleBuy = async (id) => {
    const token = localStorage.getItem("token");

    try {
      const res = await buyCoupon(
        { offer_id: id, quantity: 1 },
        token
      );

      setMessage(res.data.message);

    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Error al comprar";

      setMessage(msg);
    }

    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <>
      <Navbar />

      <div className="mt-[80px] bg-white min-h-screen w-full p-4 sm:p-6">

        <h1 className="text-3xl font-bold mb-8 text-green-800 text-left">
          OFERTAS
        </h1>

        {message && (
          <p className="text-center text-green-600 mb-6">
            {message}
          </p>
        )}

        {Object.entries(groupedOffers).map(([category, offers]) => (
          <div key={category} className="mb-12">

            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              {category}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="relative bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 shadow-md"
                >

                  <p className="font-bold text-lg text-gray-800">
                    {offer.company?.name}
                  </p>

                  <p className="text-gray-600 mb-2">
                    {offer.title}
                  </p>

                  <p className="text-sm text-gray-500 mb-3">
                    {offer.description}
                  </p>

                  <div className="border-t border-dashed my-3"></div>

                  <div className="mb-3">
                    <span className="text-gray-400 line-through mr-2">
                      ${offer.regular_price}
                    </span>
                    <span className="text-green-600 font-bold text-lg">
                      ${offer.offer_price}
                    </span>
                  </div>

                  <button
                    onClick={() => handleBuy(offer.id)}
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    Comprar
                  </button>

                  <div className="absolute top-1/2 -left-2 w-4 h-4 bg-white border border-gray-300 rounded-full hidden sm:block"></div>
                  <div className="absolute top-1/2 -right-2 w-4 h-4 bg-white border border-gray-300 rounded-full hidden sm:block"></div>

                </div>
              ))}

            </div>

          </div>
        ))}

      </div>
    </>
  );
}

export default Offers;