import axios from "axios";

const API = axios.create({
  baseURL: process.env.API_URL || `http://localhost:${process.env.PORT}`,
  timeout: 5000,
});

export const api = API;