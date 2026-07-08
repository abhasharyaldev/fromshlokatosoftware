import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const c = { cream:"#F8F1E7", black:"#0D0D0D", gold:"#C9A227", charcoal:"#1A1A1A", muted:"rgba(13,13,13,.48)", faint:"rgba(13,13,13,.10)", cmuted:"rgba(248,241,231,.55)", font:"'Inter',system-ui,sans-serif" }
const up = (d=0) => ({ initial:{opacity:0,y:18}, animate:{opacity:1,y:0}, transition:{duration:.52,delay:d,ease:[.16,1,.3,1]} })

export default function FromShlokaToSoftware() {
  const [mob, setMob] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width:768px)")
    setMob(mq.matches)
    mq.addEventListener("change", e => setMob(e.matches))
  }, [])
  const px = mob ? "20px" : "48px"

  return (
    <div style={{ background:c.cream, minHeight:"100vh", fontFamily:c.font, color:c.black, overflowX:"clip" }}>

      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:`20px ${px}`, borderBottom:`1px solid ${c.faint}`, position:"sticky", top:0, background:c.cream, zIndex:10 }}>
        <span style={{ fontSize:"15px", fontWeight:700 }}>ॐ FSTS</span>
        <div style={{ display:"flex", gap:"8px" }}>
          <a href="/login" style={{ fontSize:"14px", color:c.black, opacity:.5, textDecoration:"none", padding:"8px 16px" }}>Login</a>
          <a href="/signup" style={{ fontSize:"14px", fontWeight:600, color:c.cream, background:c.black, textDecoration:"none", padding:"9px 20px", borderRadius:"6px" }}>Sign Up</a>
        </div>
      </nav>

      <main style={{ maxWidth:"1100px", margin:"0 auto", padding:mob?"72px 20px 64px":"120px 48px 96px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center" }}>
        <motion.p {...up(0)} style={{ fontSize:"12px", fontWeight:600, letterSpacing:"0.14em", textTransform:"uppercase", color:c.gold, margin:"0 0 28px" }}>Sanskrit · Ancient Wisdom · Modern Tools</motion.p>
        <motion.h1 {...up(.08)} style={{ fontSize:mob?"clamp(40px,11vw,56px)":"clamp(60px,8vw,96px)", fontWeight:800, lineHeight:1, letterSpacing:"-0.035em", margin:"0 0 28px", overflowWrap:"anywhere", minWidth:0 }}>
          From Shloka<br/><span style={{ color:c.gold }}>to Software.</span>
        </motion.h1>
        <motion.p {...up(.16)} style={{ fontSize:mob?"17px":"20px", color:c.muted, lineHeight:1.65, maxWidth:"400px", margin:"0 0 48px" }}>Learn Sanskrit. Hear the gods speak.</motion.p>
        <motion.div {...up(.24)}>
          <a href="/signup" style={{ display:"inline-block", fontSize:"15px", fontWeight:700, color:c.black, background:c.gold, textDecoration:"none", padding:"14px 32px", borderRadius:"8px", boxShadow:"0 1px 4px rgba(0,0,0,.10)" }}>Begin Your Journey →</a>
        </motion.div>
      </main>

      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:`0 ${px}` }}><div style={{ height:"1px", background:c.faint }} /></div>

      <section style={{ maxWidth:"1100px", margin:"0 auto", padding:mob?"64px 20px 80px":"96px 48px 128px", display:"grid", gridTemplateColumns:mob?"1fr":"repeat(3,1fr)", gap:"20px" }}>
        {[
          { icon:"📖", tag:"Stories",  title:"Sacred Stories",    desc:"Learn through the Ramayana, Mahabharata, and the Puranas. Scripture as curriculum." },
          { icon:"अ",  tag:"Script",   title:"Devanagari Script", desc:"Master the alphabet of the gods, step by step. Each letter, its sound, its story." },
          { icon:"⚡", tag:"Progress", title:"Earn Shakti XP",    desc:"Level up as you learn. Unlock sacred stories, track your progress, climb the leaderboard." },
        ].map((card, i) => (
          <motion.div key={card.title} {...up(i*.1+.32)} style={{ background:c.charcoal, borderRadius:"10px", padding:mob?"32px 28px":"40px 36px", display:"flex", flexDirection:"column", gap:"12px" }}>
            <span style={{ fontSize:"26px" }}>{card.icon}</span>
            <span style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:c.gold }}>{card.tag}</span>
            <h3 style={{ fontSize:"18px", fontWeight:700, color:c.cream, letterSpacing:"-0.02em", margin:0 }}>{card.title}</h3>
            <p style={{ fontSize:"15px", color:c.cmuted, lineHeight:1.65, margin:0 }}>{card.desc}</p>
          </motion.div>
        ))}
      </section>

      <footer style={{ borderTop:`1px solid ${c.faint}`, padding:`28px ${px}`, display:"flex", flexDirection:mob?"column":"row", alignItems:mob?"flex-start":"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:"14px", fontWeight:700 }}>ॐ FSTS</span>
        <span style={{ fontSize:"13px", color:c.muted }}>© 2026 From Shloka to Software</span>
      </footer>

    </div>
  )
}
