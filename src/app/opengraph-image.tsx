import { ImageResponse } from "next/og";

export const alt = "Apprentio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          gap: 32,
          background: "#1e1b4b",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M28.1101 78.7853C27.2776 82.4217 24.0423 85 20.3118 85H13.0118C6.86685 85 3.0162 78.3595 6.06858 73.0262L45.0018 5L28.1101 78.7853Z"
            fill="white"
          />
          <path
            d="M83.9342 73.0263C86.9865 78.3595 83.1359 85 76.9909 85H69.6908C65.9603 85 62.725 82.4216 61.8926 78.7852L45.0018 5L83.9342 73.0263Z"
            fill="white"
          />
        </svg>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 600, color: "white" }}>
          Apprentio
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#c7d2fe" }}>
          Degree apprenticeship discovery for UK sixth-formers
        </div>
      </div>
    ),
    { ...size }
  );
}
