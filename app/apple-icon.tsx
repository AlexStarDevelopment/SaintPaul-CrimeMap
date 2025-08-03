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
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 120,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '32px',
          position: 'relative',
          border: '4px solid #475569',
        }}
      >
        {/* Map grid background */}
        <div
          style={{
            position: 'absolute',
            inset: '20px',
            background: '#0f172a',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid #374151',
          }}
        >
          {/* Grid lines */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '2px',
              background: '#374151',
              top: '25%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '2px',
              background: '#374151',
              top: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '2px',
              background: '#374151',
              top: '75%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              height: '100%',
              width: '2px',
              background: '#374151',
              left: '25%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              height: '100%',
              width: '2px',
              background: '#374151',
              left: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              height: '100%',
              width: '2px',
              background: '#374151',
              left: '75%',
            }}
          />
        </div>

        {/* Central shield icon */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            width: '60px',
            height: '60px',
            clipPath: 'polygon(50% 0%, 0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%)',
            position: 'relative',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        />

        {/* Crime markers around the map */}
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: '#dc2626',
            borderRadius: '50%',
            top: '35px',
            left: '35px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: '#dc2626',
            borderRadius: '50%',
            top: '45px',
            right: '35px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: '#dc2626',
            borderRadius: '50%',
            bottom: '35px',
            left: '45px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: '#dc2626',
            borderRadius: '50%',
            bottom: '45px',
            right: '45px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />

        {/* Map pin icon */}
        <div
          style={{
            position: 'absolute',
            bottom: '25px',
            right: '25px',
            width: '24px',
            height: '24px',
            background: '#f59e0b',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              width: '12px',
              height: '12px',
              background: 'white',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
