const isLocalhost = window.location.hostname === "localhost";

export const API_BASE = isLocalhost
  ? "http://5.59.233.108:8081"
  : "https://5.59.233.108:8443"; 
