export const APP_CONFIG = {
  APP_NAME: "React + Supabase App",
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  ROUTES: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/dashboard",
  },
};
