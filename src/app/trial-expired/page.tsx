"use client";

export default function TrialExpiredPage() {
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
        maxWidth: "400px",
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "16px",
        padding: "48px 32px",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        textAlign: "center",
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "#7f1d1d22",
          border: "2px solid #dc2626",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "28px",
        }}>
          ⏱
        </div>

        <h1 style={{
          color: "#f1f5f9",
          fontSize: "22px",
          fontWeight: "700",
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}>
          Trial Period Ended
        </h1>

        <p style={{
          color: "#94a3b8",
          fontSize: "14px",
          lineHeight: "1.7",
          margin: "0 0 32px",
        }}>
          Your trial version of Inventory Manager has expired.
          Please contact your service provider to continue using the application.
        </p>

        <div style={{
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "8px",
          padding: "16px",
          fontSize: "13px",
          color: "#64748b",
        }}>
          <div style={{ marginBottom: "4px", color: "#94a3b8", fontWeight: "600" }}>Contact</div>
          <div>Anuj Agnihotry</div>
          <div>anuj@balsansarindia.com</div>
        </div>

        <p style={{
          color: "#334155",
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
