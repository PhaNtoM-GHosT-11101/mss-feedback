import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(79,70,229,0.35), transparent 60%), radial-gradient(1000px 500px at 90% 100%, rgba(118,121,255,0.25), transparent 55%), #0D0E15",
          color: "#F6F6F9",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#4F46E5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              fontWeight: 900,
              color: "#fff",
            }}
          >
            R
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: -2 }}>
            REVERB
          </div>
        </div>
        <div
          style={{
            fontSize: 34,
            color: "rgba(246,246,249,0.75)",
            letterSpacing: 1,
            marginTop: 12,
          }}
        >
          Louder together
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(246,246,249,0.5)",
            marginTop: 40,
            maxWidth: 760,
            textAlign: "center",
          }}
        >
          The campus complaint wall — post anonymously, upvote what matters,
          and make your college listen.
        </div>
      </div>
    ),
    size,
  );
}