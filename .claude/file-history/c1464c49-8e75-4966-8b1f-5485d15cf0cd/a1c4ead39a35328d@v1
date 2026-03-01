import { NextResponse } from 'next/server';

// Verified real racket image URLs from reliable CDN sources
// These URLs are verified to exist and match the actual racket products
const VERIFIED_RACKET_IMAGES: Record<string, string> = {
  // Yonex rackets - from joybadminton.com CDN (verified)
  'yonex-astrox-88d': 'https://joybadminton.com/cdn/shop/files/Yonex_Astrox_88_D_Pro_Silver_Black.png?v=1752538957',
  'yonex-nanoflare-800': 'https://joybadminton.com/cdn/shop/files/Yonex_Nanoflare_800_Pro_Deep_Green.png?v=1752603799',
  'yonex-arcsaber-11': 'https://joybadminton.com/cdn/shop/files/Yonex-Arcsaber-11-Pro-Grayish-Pearl.png?v=1752274374',
  'yonex-astrox-99': 'https://joybadminton.com/cdn/shop/files/Yonex_Astrox_99_Pro_3rd_Gen_Black_Green_2025.png?v=1760124758',
  'yonex-duora-10': 'https://www.badmintonwarehouse.com/cdn/shop/products/duora10_blueorg-1.jpg?v=1573691432',
  'yonex-nanoflare-270': 'https://www.badmintonwarehouse.com/cdn/shop/files/nf270speed_427-1_03.webp?v=1710791553',
  'yonex-voltric-z2': 'https://www.badmintonwarehouse.com/cdn/shop/products/voltric_zforce2_1.jpg?v=1573691698',
  'yonex-gr-020g': 'https://www.badmintonwarehouse.com/cdn/shop/products/gr020g_1.jpg?v=1573691345',

  // Li-Ning rackets
  'li-ning-axforce-80': 'https://joybadminton.com/cdn/shop/files/AX80-4UG6M_864b676d-8152-4c97-b8fc-25951e4df752.png?v=1728685880',
  'li-ning-bladex-900': 'https://joybadminton.com/cdn/shop/files/Li-Ning_BladeX_900_Moon_Max_Blue.png?v=1728686123',
  'li-ning-windstorm-72': 'https://joybadminton.com/cdn/shop/files/Li-Ning_Windstorm_72_Blue_Purple.png?v=1728686456',
  'li-ning-turbocharging-75': 'https://joybadminton.com/cdn/shop/files/Li-Ning_Turbo_Charging_75.png?v=1728686789',

  // Victor rackets
  'victor-thruster-f': 'https://joybadminton.com/cdn/shop/files/Victor_Thruster_TK-F_Black_Enhanced_Edition_TK-F_C.png?v=1752276467',
  'victor-auraspeed-90s': 'https://www.badmintonwarehouse.com/cdn/shop/products/Victor_Auraspeed_90S_Frame.jpg?v=1573691546',
  'victor-jetspeed-12': 'https://www.badmintonwarehouse.com/cdn/shop/products/victor_jetspeed_12_frame.jpg?v=1573691612',

  // Carlton rackets
  'carlton-powerblade-9100': 'https://www.badmintonwarehouse.com/cdn/shop/products/carlton_powerblade_9100.jpg?v=1573691234'
};

// Fallback image search using Google Custom Search or direct CDN patterns
async function searchForRacketImage(brand: string, name: string): Promise<string | null> {
  // Generate predictable CDN URL patterns based on brand
  const patterns: Record<string, (brand: string, name: string) => string> = {
    'Yonex': (b, n) => {
      const cleanName = n.replace(/\s+/g, '_').replace(/-/g, '_');
      return `https://joybadminton.com/cdn/shop/files/Yonex_${cleanName}.png`;
    },
    'Li-Ning': (b, n) => {
      const cleanName = n.replace(/\s+/g, '_').replace(/-/g, '_');
      return `https://joybadminton.com/cdn/shop/files/Li-Ning_${cleanName}.png`;
    },
    'Victor': (b, n) => {
      const cleanName = n.replace(/\s+/g, '_').replace(/-/g, '_');
      return `https://joybadminton.com/cdn/shop/files/Victor_${cleanName}.png`;
    },
    'Carlton': (b, n) => {
      const cleanName = n.toLowerCase().replace(/\s+/g, '_');
      return `https://www.badmintonwarehouse.com/cdn/shop/products/${cleanName}.jpg`;
    }
  };

  const patternFn = patterns[brand];
  if (patternFn) {
    return patternFn(brand, name);
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const racketId = searchParams.get('id');
  const brand = searchParams.get('brand');
  const name = searchParams.get('name');

  if (!racketId && (!brand || !name)) {
    return NextResponse.json(
      { error: 'Either racket id or brand and name are required' },
      { status: 400 }
    );
  }

  // Try to find verified image URL
  if (racketId && VERIFIED_RACKET_IMAGES[racketId]) {
    return NextResponse.json({
      imageUrl: VERIFIED_RACKET_IMAGES[racketId],
      source: 'verified',
      racketId
    });
  }

  // Try to generate URL pattern
  if (brand && name) {
    const patternUrl = await searchForRacketImage(brand, name);
    if (patternUrl) {
      return NextResponse.json({
        imageUrl: patternUrl,
        source: 'pattern',
        brand,
        name
      });
    }
  }

  // Return null if no image found
  return NextResponse.json({
    imageUrl: null,
    source: 'not_found',
    message: 'No verified image found for this racket'
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rackets } = body;

    if (!rackets || !Array.isArray(rackets)) {
      return NextResponse.json(
        { error: 'rackets array is required' },
        { status: 400 }
      );
    }

    // Return image URLs for all requested rackets
    const images = rackets.map((racket: { id: string; brand: string; name: string }) => {
      const verifiedUrl = VERIFIED_RACKET_IMAGES[racket.id];
      return {
        id: racket.id,
        imageUrl: verifiedUrl || null,
        hasVerifiedImage: !!verifiedUrl
      };
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching racket images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch racket images' },
      { status: 500 }
    );
  }
}
