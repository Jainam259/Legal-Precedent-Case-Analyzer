import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach the logged-in advocate's token to every request.
// Read fresh from localStorage each time so a re-login always takes effect,
// and so a NEW advocate's requests are never sent with a stale token.
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Token ${token}`; // change to `Bearer ${token}` if your backend issues JWTs
    }
    return config;
});

export default API;