import { NextResponse, type NextRequest } from 'next/server';

// Local deployment: no remote session to refresh. Pass the request through.
export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request });
}
