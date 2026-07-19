export default function ECGLine({ color = "#e2536f", height = 60 }: { color?: string; height?: number }) {
  return (
    <div className="ecg-line" aria-hidden>
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none" style={{ height }}>
        <path
          className="ecg-path"
          d="M0,40 L140,40 L160,40 L172,20 L184,60 L196,40 L240,40 L252,34 L264,40 L420,40 L440,40 L452,12 L466,70 L480,40 L540,40 L552,32 L564,40 L760,40 L772,22 L784,58 L796,40 L860,40 L872,35 L884,40 L1060,40 L1072,16 L1086,66 L1100,40 L1200,40"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
