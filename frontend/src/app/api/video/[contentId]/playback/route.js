import { NextResponse } from 'next/server';

export async function GET(req, context) {
  const { contentId } = context.params;
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL || 'https://atomslmsapi.abc.courses/atoms';
  const backendUrl = `${backendBaseUrl}/api/video/${contentId}/playback`;

  // Forward all relevant headers (authorization, cookies, etc.)
  const headers = {};
  const authHeader = req.headers.get('authorization');
  if (authHeader) headers['Authorization'] = authHeader;
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  let response;
  try {
    response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Could not reach backend' }, { status: 500 });
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Invalid backend response' }, { status: 500 });
  }

  return NextResponse.json(data, { status: response.status });
} 