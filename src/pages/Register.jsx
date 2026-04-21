import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("As passwords não coincidem");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Conta criada com sucesso!");
    setTimeout(() => navigate("/login"), 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] px-6">
      <div className="bg-[#111] p-8 rounded-xl shadow-xl w-full max-w-sm border border-[#222]">

        <h1 className="text-2xl font-bold text-center text-[#facc15] mb-6">
          Criar Conta
        </h1>

        {error && (
          <div className="text-red-500 text-center mb-4 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-500 text-center mb-4 font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">

          <input
            type="email"
            placeholder="Email"
            className="bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg focus:border-[#facc15] outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg focus:border-[#facc15] outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirmar Password"
            className="bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg focus:border-[#facc15] outline-none"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button
            className="bg-[#facc15] hover:bg-[#eab308] text-black font-semibold p-3 rounded-lg transition"
          >
            Criar Conta
          </button>
        </form>

        <button
          onClick={() => navigate("/login")}
          className="mt-4 text-[#facc15] underline w-full text-center"
        >
          Já tenho conta
        </button>
      </div>
    </div>
  );
}
