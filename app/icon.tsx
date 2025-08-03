import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: '#1e293b',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '6px',
          position: 'relative',
        }}
      >
        {/* Map grid background */}
        <div
          style={{
            position: 'absolute',
            inset: '4px',
            background: '#0f172a',
            borderRadius: '2px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Grid lines simulation */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '1px',
              background: '#374151',
              top: '33%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '1px',
              background: '#374151',
              top: '66%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              height: '100%',
              width: '1px',
              background: '#374151',
              left: '33%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              height: '100%',
              width: '1px',
              background: '#374151',
              left: '66%',
            }}
          />
        </div>

        {/* Shield icon in center */}
        <div
          style={{
            background: '#ef4444',
            width: '12px',
            height: '12px',
            clipPath: 'polygon(50% 0%, 0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%)',
            position: 'relative',
            zIndex: 10,
          }}
        />

        {/* Crime markers */}
        <div
          style={{
            position: 'absolute',
            width: '3px',
            height: '3px',
            background: '#dc2626',
            borderRadius: '50%',
            top: '6px',
            left: '6px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '3px',
            height: '3px',
            background: '#dc2626',
            borderRadius: '50%',
            top: '8px',
            right: '6px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '3px',
            height: '3px',
            background: '#dc2626',
            borderRadius: '50%',
            bottom: '6px',
            left: '8px',
          }}
        />
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
