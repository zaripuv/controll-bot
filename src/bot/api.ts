import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
  timeout: 5000,
});

export const api = API;