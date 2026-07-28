import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A2236",
          borderRadius: 7,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 4h2l1.6 9.6a1.5 1.5 0 001.5 1.4h6.4a1.5 1.5 0 001.5-1.3L17 7H5.5"
            stroke="#F97316"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.3 8.1h4.9l-4.9 4h4.9"
            stroke="#F97316"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="17" r="1.1" fill="#F97316" />
          <circle cx="14.5" cy="17" r="1.1" fill="#F97316" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
