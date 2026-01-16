import { NextRequest, NextResponse } from 'next/server';

export interface AnalyticsPayload {
  events: Array<{
    category: string;
    action: string;
    metadata: Record<string, unknown>;
    timestamp: number;
  }>;
  sessionId: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AnalyticsPayload;

    console.log('[Analytics API] Received events:', body.events.length);

    if (body.events.length === 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const aggregated = {
      sessionId: body.sessionId,
      timestamp: body.timestamp,
      events: body.events.map(event => ({
        category: event.category,
        action: event.action,
        metadata: event.metadata,
        timestamp: event.timestamp,
      })),
    };

    console.log('[Analytics API] Aggregated events:', aggregated.events.length);

    return NextResponse.json({ 
      success: true, 
      received: body.events.length,
      aggregated: aggregated.events.length,
    }, { status: 200 });

  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process analytics' },
      { status: 400 }
    );
  }
}
