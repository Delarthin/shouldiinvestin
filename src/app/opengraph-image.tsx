import { ImageResponse } from "next/og";

export const alt = "Should I Invest In?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFF5F0",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: "#1a1a1a",
              lineHeight: 0.95,
              textAlign: "center",
              letterSpacing: "-0.03em",
            }}
          >
            SHOULD I
          </div>
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: "#1a1a1a",
              lineHeight: 0.95,
              textAlign: "center",
              letterSpacing: "-0.03em",
            }}
          >
            INVEST IN
          </div>
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: "#e8501a",
              lineHeight: 0.95,
              textAlign: "center",
              letterSpacing: "-0.03em",
            }}
          >
            ___?
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#888",
            marginTop: 30,
          }}
        >
          Daily AI-powered BULLISH/BEARISH predictions
        </div>
      </div>
    ),
    { ...size }
  );
}
