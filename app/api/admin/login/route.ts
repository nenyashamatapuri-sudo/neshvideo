import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';

  if (username !== adminUsername || password !== adminPassword) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Generate a simple token
  const token = crypto.randomBytes(32).toString('hex');

  return NextResponse.json({
    token,
    message: 'Logged in successfully',
  });
}
