"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

const VOWELS = [
  {
    char: "अ",
    roman: "a",
    name: "A",
    caption: "This is the first letter of the oldest language on Earth.",
    audio: "a — as in 'about'",
  },
  {
    char: "आ",
    roman: "ā",
    name: "Ā",
    caption: "This is its longer form — held twice as long when spoken.",
    audio: "aa — as in 'father'",
  },
  {
    char: "इ",
    roman: "i",
    name: "I",
    caption: "The third vowel. Listen to how it lifts.",
    audio: "i — as in 'sit'",
  },
  {
    char: "ई",
    roman: "ī",
    name: "Ī",
    caption: "Its longer form. A sound that stretches across millennia.",
    audio: "ee — as in 'feet'",
  },
  {
    char: "उ",
    roman: "u",
    name: "U",
    caption: "The fifth vowel. The sound of breath itself.",
    audio: "u — as in 'put'",
  },
]

type Phase = "char" | "caption" | "audio" | "next"

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>("char")
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [done, setDone] = useState(false)

  const vowel = VOWELS[step]

  useEffect(() => {
    if (phase === "char") {
      const t = setTimeout(() => setPhase("caption"), 2000)
      return () => clearTimeout(t)
    }
  }, [phase, step])

  function handleAudio() {
    setAudioPlaying(true)
    setTimeout(() => {
      setAudioPlaying(false)
      setPhase("next")
    }, 1200)
  }

  function handleNext() {
    if (step < VOWELS.length - 1) {
      setStep(step + 1)
      setPhase("char")
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ background: "var(--onboard-bg)" }}
      >
        <div className="fade-in" style={{ maxWidth: 560 }}>
          <div
            className="font-devanagari fade-in-slow"
            style={{
              fontSize: "clamp(48px, 8vw, 96px)",
              color: "var(--cream)",
              opacity: 0.15,
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              userSelect: "none",
              pointerEvents: "none",
              letterSpacing: "0.05em",
            }}
          >
            ॐ
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="eyebrow" style={{ color: "rgba(214,168,79,0.7)", marginBottom: 32 }}>
              You have heard the beginning
            </div>

            <h1
              className="font-cinzel"
              style={{
                fontSize: "clamp(32px, 5vw, 64px)",
                fontWeight: 700,
                color: "var(--cream)",
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
                marginBottom: 24,
              }}
            >
              Now{" "}
              <span style={{ color: "var(--gold)" }}>begin.</span>
            </h1>

            <p
              className="font-manrope"
              style={{
                fontSize: 17,
                lineHeight: 1.7,
                color: "rgba(244,225,193,0.55)",
                marginBottom: 48,
                maxWidth: 420,
                margin: "0 auto 48px",
              }}
            >
              Five vowels. Four thousand years of tradition. One extraordinary language — waiting for you.
            </p>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/signup" className="btn-gold" style={{ fontSize: 13, padding: "16px 40px" }}>
                Begin
              </Link>
              <Link href="/login" className="btn-ghost" style={{ fontSize: 13, padding: "16px 40px", borderColor: "rgba(214,168,79,0.25)", color: "rgba(214,168,79,0.7)" }}>
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "var(--onboard-bg)", position: "relative", overflow: "hidden" }}
    >
      {/* Background glow */}
      <div
        className="char-glow"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "min(60vw, 400px)",
          height: "min(60vw, 400px)",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(90,30,45,0.5) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Step dots */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
        }}
      >
        {VOWELS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i < step ? "var(--gold)" : i === step ? "var(--gold)" : "rgba(244,225,193,0.2)",
              transition: "all 300ms ease",
            }}
          />
        ))}
      </div>

      {/* Main character */}
      <div
        key={step}
        className="fade-in"
        style={{ textAlign: "center", position: "relative", zIndex: 1, padding: "0 24px" }}
      >
        <div
          className="font-devanagari"
          style={{
            fontSize: "clamp(140px, 25vw, 220px)",
            color: "var(--cream)",
            lineHeight: 1,
            marginBottom: 16,
            fontWeight: 400,
          }}
        >
          {vowel.char}
        </div>

        <div
          className="font-cinzel"
          style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            color: "var(--gold)",
            fontWeight: 500,
            letterSpacing: "0.1em",
            marginBottom: 8,
          }}
        >
          {vowel.roman}
        </div>

        {/* Caption — appears after 2s delay */}
        <div
          style={{
            minHeight: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {(phase === "caption" || phase === "audio" || phase === "next") && (
            <p
              className="font-manrope fade-in"
              style={{
                fontSize: "clamp(15px, 2vw, 18px)",
                color: "rgba(244,225,193,0.60)",
                maxWidth: 360,
                lineHeight: 1.6,
                textAlign: "center",
              }}
            >
              {vowel.caption}
            </p>
          )}

          {(phase === "caption" || phase === "audio") && (
            <button
              className="fade-in"
              onClick={handleAudio}
              disabled={audioPlaying}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontFamily: "'Manrope', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--gold)",
                background: "transparent",
                border: "1px solid rgba(214,168,79,0.30)",
                padding: "12px 24px",
                cursor: "pointer",
              }}
            >
              <AudioWaveIcon playing={audioPlaying} />
              {audioPlaying ? vowel.audio : "What does it sound like?"}
            </button>
          )}

          {phase === "next" && (
            <button
              className="btn-gold fade-in"
              onClick={handleNext}
              style={{ fontSize: 12, padding: "14px 40px" }}
            >
              {step < VOWELS.length - 1 ? "Next" : "Continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AudioWaveIcon({ playing }: { playing: boolean }) {
  const bars = [6, 10, 14, 10, 6]
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" style={{ flexShrink: 0 }}>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 4}
          y={(14 - h) / 2}
          width="2.5"
          height={h}
          fill="var(--gold)"
          rx="1"
          style={
            playing
              ? {
                  animation: `wave-bar 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
                }
              : undefined
          }
        />
      ))}
      <style>{`
        @keyframes wave-bar {
          from { transform: scaleY(0.4); transform-origin: center; }
          to   { transform: scaleY(1.0); transform-origin: center; }
        }
      `}</style>
    </svg>
  )
}
