import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "semo — 말하면, 정리된다";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        background:
          "linear-gradient(135deg, #6366F1 0%, #4F46E5 60%, #3730A3 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "0.05em",
          marginBottom: 24,
        }}
      >
        semo
      </div>
      <div
        style={{
          color: "#fff",
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.15,
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        말하면, 정리된다.
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.75)",
          fontSize: 28,
          fontWeight: 400,
          marginTop: 24,
          textAlign: "center",
          maxWidth: 640,
        }}
      >
        녹음 버튼 하나로 아이디어, 회의, 메모를 구조화된 노트로.
      </div>
    </div>,
    { ...size },
  );
}
