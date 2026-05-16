import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0d0118" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-yellow-600/30">
        <span className="pixel-font text-xs" style={{ color: "#FFD700" }}>
          ॐ FSTS
        </span>
        <div className="flex gap-4">
          <Link href="/login" className="pixel-btn-ghost text-xs py-2 px-4">
            Login
          </Link>
          <Link href="/signup" className="pixel-btn text-xs py-2 px-4">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center flex-1 text-center px-4 py-16 gap-8">

        {/* Sprites */}
        <div className="float-anim">
          <Image
            src="/sprites.png"
            alt="Hindu deities pixel art"
            width={700}
            height={220}
            className="mx-auto"
            style={{ imageRendering: "pixelated" }}
            priority
          />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-4">
          <h1 className="pixel-font glow-gold leading-relaxed" style={{ fontSize: "clamp(14px, 3vw, 26px)", color: "#FFD700" }}>
            FROM SHLOKA<br />TO SOFTWARE
          </h1>
          <p className="shimmer-text" style={{ fontFamily: "'VT323', monospace", fontSize: "28px" }}>
            Learn Sanskrit. Hear the gods speak.
          </p>
        </div>

        {/* XP bar teaser */}
        <div className="flex items-center gap-3 pixel-border px-6 py-3" style={{ borderColor: "#6b21a8" }}>
          <span style={{ color: "#FFD700", fontFamily: "'Press Start 2P', monospace", fontSize: "10px" }}>LVL 1</span>
          <div className="w-40 h-3 bg-purple-900 border border-purple-500">
            <div className="h-full w-0" style={{ background: "#FFD700" }} />
          </div>
          <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Press Start 2P', monospace", fontSize: "10px" }}>0 XP</span>
        </div>

        {/* CTA */}
        <Link href="/signup" className="pixel-btn" style={{ fontSize: "13px", padding: "18px 40px" }}>
          ▶ Begin Your Journey
        </Link>

        <p className="blink" style={{ color: "#FFD700", fontFamily: "'Press Start 2P', monospace", fontSize: "9px" }}>
          INSERT COIN TO CONTINUE
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 max-w-3xl w-full">
          {[
            { icon: "📖", title: "Sacred Stories", desc: "Learn through Ramayana, Mahabharata & the Puranas" },
            { icon: "🔤", title: "Devanagari Script", desc: "Master the alphabet of the gods step by step" },
            { icon: "⚡", title: "Earn Shakti XP", desc: "Level up, unlock stories, climb the leaderboard" },
          ].map((card) => (
            <div key={card.title} className="pixel-border p-5 flex flex-col gap-3 text-left" style={{ background: "rgba(255,215,0,0.03)" }}>
              <span style={{ fontSize: "32px" }}>{card.icon}</span>
              <h3 className="pixel-font" style={{ fontSize: "10px", color: "#FFD700" }}>{card.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'VT323', monospace", fontSize: "18px", lineHeight: "1.4" }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-4 border-t border-yellow-600/20" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Press Start 2P', monospace", fontSize: "8px" }}>
        © 2026 FROMSHLOKATOSOFTWARE
      </footer>
    </div>
  );
}
