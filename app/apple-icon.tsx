import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '32px',
          border: '4px solid #0d47a1',
        }}
      >
        {/* Simple shield icon */}
        <div
          style={{
            background: '#ffffff',
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            color: '#1976d2',
            fontWeight: 'bold',
          }}
        >
          SP
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
