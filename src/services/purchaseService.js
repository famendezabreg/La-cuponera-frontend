import api from "./api";

export const buyCoupon = (data, token) => {
  return api.post("/purchases", data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};