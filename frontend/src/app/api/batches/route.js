import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
    const apikey = request.headers.get("X-API-Key");
  const url = 'https://abc-api.edmingle.com/nuSource/api/v1/short/masterbatch';
  const params = {
    organization_id: 3,
    status: 0,
    page: 1,
    per_page: 50,
  };

  try {
    const response = await axios.get(url, {
      params,
      headers: {
        apikey:apikey,
        ORGID:"3"
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || 'Failed to fetch data';
    return NextResponse.json({ error: message }, { status });
  }
}
