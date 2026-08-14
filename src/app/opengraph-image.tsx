import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'BewerbRadar Copilot - AI Resume and Cover Letter Builder';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.15), transparent 40%), radial-gradient(circle at 75% 75%, rgba(15, 118, 110, 0.2), transparent 40%)',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
              color: '#ffffff',
            }}
          >
            B
          </div>
          <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
            BewerbRadar Copilot
          </span>
        </div>

        {/* Hero Title & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '50px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              margin: 0,
            }}
          >
            <span style={{ display: 'block' }}>Lebenslauf & Anschreiben mit KI</span>
            <span style={{ display: 'block', color: '#34d399' }}>
              Resume & Cover Letter with AI
            </span>
          </div>
          <p
            style={{
              fontSize: '24px',
              lineHeight: 1.4,
              color: '#a1a1aa',
              margin: 0,
            }}
          >
            AI-powered - ATS-ready - 40+ Templates - PDF & DOCX
          </p>
        </div>

        {/* Feature Badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '18px',
              fontWeight: 500,
              color: '#e4e4e7',
            }}
          >
            ATS-ready
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '18px',
              fontWeight: 500,
              color: '#e4e4e7',
            }}
          >
            40+ Templates
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '18px',
              fontWeight: 500,
              color: '#e4e4e7',
            }}
          >
            AI Writing
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontSize: '18px',
              fontWeight: 600,
              color: '#34d399',
            }}
          >
            PDF & DOCX Export
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
