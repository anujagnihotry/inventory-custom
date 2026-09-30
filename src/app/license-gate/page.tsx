"use client";

import { useState } from "react";
import { Lock, ShieldCheck, AlertCircle } from "lucide-react";

export default function LicenseGatePage() {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (res.ok) {
        setUnlocked(true);
        setTimeout(() => { window.location.replace("/"); }, 1200);
      } else {
        const data = await res.json();
        setError(data.error || "Incorrect password. Please try again.");
        setPassword("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      padding: "24px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "380px",
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "16px",
        padding: "40px 32px",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      }}>
        {/* Icon */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: unlocked ? "#16a34a22" : "#1d4ed822",
            border: `2px solid ${unlocked ? "#16a34a" : "#3b82f6"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            transition: "all 0.3s ease",
          }}>
            {unlocked
              ? <ShieldCheck size={28} color="#22c55e" />
              : <Lock size={28} color="#60a5fa" />
            }
          </div>
          <h1 style={{
            color: "#f1f5f9",
            fontSize: "20px",
            fontWeight: "700",
            margin: "0 0 6px",
            letterSpacing: "-0.02em",
          }}>
            {unlocked ? "Access Granted" : "License Verification"}
          </h1>
          <p style={{
            color: "#64748b",
            fontSize: "13px",
            margin: 0,
            lineHeight: "1.5",
          }}>
            {unlocked
              ? "Redirecting you to the application..."
              : "Your license requires periodic verification.\nEnter the activation password to continue."}
          </p>
        </div>

        {/* Form */}
        {!unlocked && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                color: "#94a3b8",
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}>
                Activation Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: "#0f172a",
                  border: `1px solid ${error ? "#ef4444" : "#334155"}`,
                  borderRadius: "8px",
                  color: "#f1f5f9",
                  fontSize: "15px",
                  outline: "none",
                  fontFamily: "inherit",
                  letterSpacing: "0.08em",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
              />
            </div>

            {error && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#7f1d1d22",
                border: "1px solid #991b1b",
                borderRadius: "6px",
                padding: "10px 12px",
                marginBottom: "16px",
              }}>
                <AlertCircle size={15} color="#f87171" style={{ flexShrink: 0 }} />
                <span style={{ color: "#f87171", fontSize: "13px" }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              style={{
                width: "100%",
                padding: "12px",
                background: loading || !password.trim() ? "#1e40af88" : "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: loading || !password.trim() ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                fontFamily: "inherit",
              }}
            >
              {loading ? "Verifying..." : "Activate"}
            </button>
          </form>
        )}

        {/* Footer */}
        <p style={{
          textAlign: "center",
          color: "#475569",
          fontSize: "11px",
          marginTop: "28px",
          marginBottom: 0,
        }}>
          Inventory Manager · Licensed Software
        </p>
      </div>
    </div>
  );
}
