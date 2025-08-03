import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          fontSize: 32,
          fontWeight: 600,
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 25% 25%, rgba(120, 144, 156, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)',
          }}
        />

        {/* Main content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
            padding: '40px',
            zIndex: 10,
          }}
        >
          {/* Map visualization */}
          <div
            style={{
              width: '300px',
              height: '300px',
              background: '#0f172a',
              borderRadius: '16px',
              border: '4px solid #475569',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Grid lines */}
            <div
              style={{
                position: 'absolute',
                inset: '20px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '2px',
                  background: '#374151',
                  top: '20%',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '2px',
                  background: '#374151',
                  top: '40%',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '2px',
                  background: '#374151',
                  top: '60%',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '2px',
                  background: '#374151',
                  top: '80%',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  height: '100%',
                  width: '2px',
                  background: '#374151',
                  left: '20%',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  height: '100%',
                  width: '2px',
                  background: '#374151',
                  left: '40%',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  height: '100%',
                  width: '2px',
                  background: '#374151',
                  left: '60%',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  height: '100%',
                  width: '2px',
                  background: '#374151',
                  left: '80%',
                }}
              />
            </div>

            {/* Central shield */}
            <div
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                width: '80px',
                height: '80px',
                clipPath: 'polygon(50% 0%, 0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            />

            {/* Crime markers */}
            <div
              style={{
                position: 'absolute',
                width: '16px',
                height: '16px',
                background: '#dc2626',
                borderRadius: '50%',
                top: '60px',
                left: '60px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '16px',
                height: '16px',
                background: '#dc2626',
                borderRadius: '50%',
                top: '80px',
                right: '60px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '16px',
                height: '16px',
                background: '#dc2626',
                borderRadius: '50%',
                bottom: '60px',
                left: '80px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '16px',
                height: '16px',
                background: '#dc2626',
                borderRadius: '50%',
                bottom: '80px',
                right: '80px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '16px',
                height: '16px',
                background: '#dc2626',
                borderRadius: '50%',
                top: '120px',
                left: '120px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '16px',
                height: '16px',
                background: '#dc2626',
                borderRadius: '50%',
                top: '140px',
                right: '120px',
              }}
            />
          </div>

          {/* Text content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              maxWidth: '600px',
            }}
          >
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 700,
                margin: 0,
                marginBottom: '20px',
                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1.1,
              }}
            >
              Saint Paul
            </h1>
            <h2
              style={{
                fontSize: '48px',
                fontWeight: 600,
                margin: 0,
                marginBottom: '24px',
                color: '#78909c',
                lineHeight: 1.1,
              }}
            >
              Crime Map
            </h2>
            <p
              style={{
                fontSize: '24px',
                fontWeight: 400,
                margin: 0,
                color: '#cbd5e1',
                lineHeight: 1.4,
              }}
            >
              Interactive neighborhood crime data visualization for Saint Paul, Minnesota
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '32px',
                padding: '12px 24px',
                background: 'rgba(120, 144, 156, 0.2)',
                borderRadius: '8px',
                border: '1px solid rgba(120, 144, 156, 0.3)',
              }}
            >
              <span style={{ fontSize: '18px', color: '#e2e8f0' }}>🗺️ Free Public Resource</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
