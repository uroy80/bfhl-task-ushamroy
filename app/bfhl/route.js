import { NextResponse } from 'next/server';
import { processData } from '@/lib/processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ENTRIES = 10_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function getIdentity() {
  const fullName = process.env.USER_FULL_NAME || 'johndoe';
  const dob = process.env.USER_DOB_DDMMYYYY || '17091999';
  return {
    user_id: `${fullName}_${dob}`,
    email_id: process.env.USER_EMAIL || 'john.doe@college.edu',
    college_roll_number: process.env.USER_ROLL_NUMBER || '21CS1001',
  };
}

function errorResponse(status, message) {
  return NextResponse.json({ error: message }, { status, headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(
    {
      ...getIdentity(),
      status: 'operational',
      endpoint: 'POST /bfhl',
      request_shape: { data: ['A->B', 'A->C'] },
    },
    { status: 200, headers: corsHeaders },
  );
}

export async function POST(request) {
  const startedAt = Date.now();

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return errorResponse(415, 'Content-Type must be application/json');
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return errorResponse(400, 'Request body must be a JSON object');
  }

  if (!Array.isArray(body.data)) {
    return errorResponse(400, 'Request body must contain { "data": [...] }');
  }

  if (body.data.length > MAX_ENTRIES) {
    return errorResponse(413, `data exceeds maximum of ${MAX_ENTRIES} entries`);
  }

  let processed;
  try {
    processed = processData(body.data);
  } catch (e) {
    return errorResponse(500, e && e.message ? e.message : 'Processing failed');
  }

  const response = NextResponse.json(
    { ...getIdentity(), ...processed },
    { status: 200, headers: corsHeaders },
  );
  response.headers.set('x-response-time-ms', String(Date.now() - startedAt));
  return response;
}
