import axios from "axios";

const api = axios.create({
  baseURL: "http://la_cuponer_backend.test/api"
});

export default api;