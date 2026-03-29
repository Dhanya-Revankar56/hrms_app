import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    // MOCK CHECK: Prevent login if it's a simulated relieved user
    // (In production, the backend returns this after checking app_status)
    if (email.toLowerCase().includes("relieved")) {
      setError("This account has been deactivated (Relieved). Login blocked.");
      return;
    }

    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1200));

    setLoading(false);

    navigate("/dashboard");
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif"
      }}
    >

      {/* LEFT PANEL */}
      <div
        style={{
          background: "#0f2545",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px"
        }}
      >
        <h1 style={{ fontSize: "34px", marginBottom: "20px" }}>
          CampusHR
        </h1>

        <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
          "Building stronger institutions through smarter workforce management."
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >

        <div
          style={{
            width: "380px",
            background: "white",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
          }}
        >

          <h2 style={{ marginBottom: "10px" }}>
            Welcome back
          </h2>

          <p style={{ color: "#64748b", marginBottom: "30px" }}>
            Sign in to your account
          </p>

          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "14px"
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "15px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "20px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#1d4ed8",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}