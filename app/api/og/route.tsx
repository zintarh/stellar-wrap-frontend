import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import React from "react";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username') || 'StellarUser';
    const transactions = searchParams.get('transactions') || '0';
    const persona = searchParams.get('persona') || 'Network Pioneer';
    const topVibe = searchParams.get('topVibe') || 'Steady';
    const vibePercentage = searchParams.get('vibePercentage') || '0';

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
            backgroundColor: '#000000',
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(5, 64, 32, 0.4) 0%, #000000 80%)',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '1000px',
              height: '1000px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '60px',
              backgroundColor: 'rgba(5, 64, 32, 0.1)',
              backgroundImage: 'linear-gradient(135deg, rgba(5, 64, 32, 0.2) 0%, rgba(0, 0, 0, 0.8) 100%)',
              padding: '60px',
              position: 'relative',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#054020', marginRight: '24px' }} />
                <span style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.7)' }}>
                    STELLAR WRAPPED 2026
                </span>
                </div>
                <h1 style={{ fontSize: '90px', fontWeight: 900, margin: 0, padding: 0, lineHeight: 1.1 }}>
                @{username}
                </h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '40px', marginBottom: '40px' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '30px',
                    padding: '40px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '15px' }}>
                        Total Transactions
                    </span>
                    <span style={{ fontSize: '100px', fontWeight: 900, lineHeight: 1 }}>
                        {transactions}
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '30px',
                    padding: '40px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '15px' }}>
                        Persona
                    </span>
                    <span style={{ 
                        fontSize: '60px', 
                        fontWeight: 900, 
                        backgroundImage: 'linear-gradient(90deg, #ffffff, #054020)',
                        backgroundClip: 'text',
                        color: 'transparent',
                        lineHeight: 1.2
                    }}>
                        {persona} 
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '30px',
                    padding: '40px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '15px' }}>
                        Top Vibe
                    </span>
                    <span style={{ fontSize: '50px', fontWeight: 900, color: 'white' }}>
                        {vibePercentage}% {topVibe}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>stellar.org/wrapped</span>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '24px', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#054020' }} />
              </div>
            </div>
          </div>
        </div>
      ) as React.ReactElement,
      {
        width: 1200,
        height: 1200,
      }
    );
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
    }
    return new Response(`Failed to generate the image`, { status: 500 });
  }
}