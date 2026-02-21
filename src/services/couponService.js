import api from "./api";

export const getCoupons = (token) => {
  return api.get("/my-coupons", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};