import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Coupons() {
  const [groupedCoupons, setGroupedCoupons] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    api.get("/my-coupons", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        const coupons = res.data.data;
        const grouped = {};

        coupons.forEach(coupon => {
          const category =
            coupon.offer?.company?.category?.name || "Otros";

          if (!grouped[category]) {
            grouped[category] = [];
          }

          grouped[category].push(coupon);
        });

        setGroupedCoupons(grouped);
      })
      .catch(err => console.log(err));
  }, [navigate]);

  return (
    <>
      <Navbar />

      <div className="mt-[80px] bg-white min-h-screen w-full p-4 sm:p-6">

        <h1 className="text-3xl font-bold mb-8 text-blue-800 text-left">
          MIS CUPONES
        </h1>

        {Object.entries(groupedCoupons).map(([category, coupons]) => (
          <div key={category} className="mb-12">

            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              {category}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

              {coupons.map(coupon => (
                <div
                  key={coupon.id}
                  className="relative bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 shadow-md"
                >

                  <p className="font-bold text-lg text-gray-800">
                    {coupon.offer?.company?.name}
                  </p>

                  <p className="text-gray-600 mb-3">
                    {coupon.offer?.title}
                  </p>

                  <div className="bg-gray-100 p-2 rounded text-center mb-3">
                    <p className="text-xs text-gray-500">Código</p>
                    <p className="font-mono font-bold text-blue-600 break-all">
                      {coupon.code}
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Válido hasta: {coupon.expiration_date}
                  </p>

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

export default Coupons;