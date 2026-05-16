import Link from "next/link";

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: "#0d0118" }}>

      <Link href="/" className="pixel-font glow-gold mb-8 text-center block" style={{ color: "#FFD700", fontSize: "12px" }}>
        ← FSTS
      </Link>

      <div className="w-full max-w-md">
        <div className="pixel-border p-8 flex flex-col gap-6" style={{ background: "rgba(255,215,0,0.03)" }}>
          <div className="text-center">
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>🪔</div>
            <h1 className="pixel-font glow-gold" style={{ fontSize: "13px", color: "#FFD700" }}>
              WELCOME BACK
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'VT323', monospace", fontSize: "18px", marginTop: "8px" }}>
              The gods await your return
            </p>
          </div>

          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="pixel-font" style={{ fontSize: "8px", color: "#FFD700" }}>EMAIL</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="pixel-input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="pixel-font" style={{ fontSize: "8px", color: "#FFD700" }}>PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                className="pixel-input"
              />
            </div>

            <button type="submit" className="pixel-btn w-full mt-2" style={{ fontSize: "11px" }}>
              ▶ CONTINUE JOURNEY
            </button>
          </form>

          <p className="text-center" style={{ fontFamily: "'VT323', monospace", fontSize: "18px", color: "rgba(255,255,255,0.4)" }}>
            New here?{" "}
            <Link href="/signup" style={{ color: "#FFD700", textDecoration: "underline" }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
