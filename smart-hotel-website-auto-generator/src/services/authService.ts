import api from "@/lib/axios";

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData) => {
  const response = await api.post("/register", data);

  return response.data;
};

export const forgetPassword = async (email: string) => {
  console.log("Sending forget password request for email:", email);
  const response = await api.post("/forget", { email });

  return response.data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await api.post("/forget/reset", { token, password });
  return response.data;
};

export const verifyEmail = async (token: string) => {
  const response = await api.get(`/verify-email?token=${token}`);

  return response.data;
};
