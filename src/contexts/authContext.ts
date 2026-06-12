import { createContext } from "react";

export const AuthContext = createContext({
  isAuthenticated: true as boolean,
  setIsAuthenticated: (() => {}) as (v: boolean) => void,
  logout: () => {},
});
