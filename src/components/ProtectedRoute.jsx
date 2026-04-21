import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    }
    checkSession();
  }, []);

  if (loading) {
    return <div className="text-white p-6">A carregar...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
