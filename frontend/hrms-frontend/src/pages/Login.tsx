import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        role
        institution_id
      }
    }
  }
`;

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

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-institution-id": "COLLEGE_A",
        },
        body: JSON.stringify({
          query: LOGIN_MUTATION,
          variables: { email, password },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        setError(result.errors[0]?.message || "Login failed. Please try again.");
        return;
      }

      const { token, user } = result.data.login;

      // Store token and institution in localStorage for Apollo Client
      localStorage.setItem("token", token);
      localStorage.setItem("institution_id", user.institution_id || "COLLEGE_A");
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error. Please check your connection.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
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