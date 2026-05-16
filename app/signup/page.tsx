import Link from "next/link";
import Image from "next/image";

export default function SignUp() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: "#0d0118" }}>

      {/* Logo */}
      <Link href="/" className="pixel-font glow-gold mb-8 text-center block" style={{ color: "#FFD700", fontSize: "12px" }}>
        ← FSTS
      </Link>

      <div className="w-full max-w-md">

        {/* Sprite mascot */}
        <div className="float-anim flex justify-center mb-6">
          <Image
            src="/sprites.png"
            alt="Hindu deities pixel art"
            width={420}
            height={130}
            style={{
              imageRendering: "pixelated",
              objectFit: "cover",
              objectPosition: "center top",
              height: "130px",
            }}
          />
        </div>

        {/* Card */}
        <div className="pixel-border p-8 flex flex-col gap-6" style={{ background: "rgba(255,215,0,0.03)" }}>
          <div className="text-center">
            <h1 className="pixel-font glow-gold" style={{ fontSize: "13px", color: "#FFD700" }}>
              CREATE ACCOUNT
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'VT323', monospace", fontSize: "18px", marginTop: "8px" }}>
              Your journey to the gods begins here
            </p>
          </div>

          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="pixel-font" style={{ fontSize: "8px", color: "#FFD700" }}>USERNAME</label>
              <input
                type="text"
                placeholder="ArjunaTheFearless"
                className="pixel-input"
              />
            </div>

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

            {/* Choose your deity */}
            <div className="flex flex-col gap-3">
              <label className="pixel-font" style={{ fontSize: "8px", color: "#FFD700" }}>CHOOSE YOUR GUIDE</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "GANESHA", emoji: "🐘", desc: "Remover of obstacles" },
                  { name: "SARASWATI", emoji: "🎵", desc: "Goddess of wisdom" },
                  { name: "HANUMAN", emoji: "🙏", desc: "God of devotion" },
                ].map((deity) => (
                  <label key={deity.name} className="cursor-pointer">
                    <input type="radio" name="deity" value={deity.name} className="hidden peer" />
                    <div
                      className="peer-checked:border-yellow-400 peer-checked:bg-yellow-400/10 border-2 border-purple-700 p-3 text-center transition-all"
                      style={{ cursor: "pointer" }}
                    >
                      <div style={{ fontSize: "28px" }}>{deity.emoji}</div>
                      <div className="pixel-font" style={{ fontSize: "7px", color: "#FFD700", marginTop: "4px" }}>{deity.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'VT323', monospace", fontSize: "13px", marginTop: "2px", lineHeight: "1.2" }}>{deity.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="pixel-btn w-full mt-2" style={{ fontSize: "11px" }}>
              ▶ START LEARNING
            </button>
          </form>

          <p className="text-center" style={{ fontFamily: "'VT323', monospace", fontSize: "18px", color: "rgba(255,255,255,0.4)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#FFD700", textDecoration: "underline" }}>
              Login
            </Link>
          </p>
        </div>

        {/* flavor text */}
        <p className="text-center mt-6" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px", color: "rgba(255,255,255,0.2)" }}>
          ॐ FREE FOREVER FOR LEARNERS ॐ
        </p>
      </div>
    </div>
  );
}
