import { apiLogin, apiLogout } from "./api";

export async function signIn(email: string, password: string) {
  return apiLogin(email, password);
}

export async function signOut() {
  return apiLogout();
}