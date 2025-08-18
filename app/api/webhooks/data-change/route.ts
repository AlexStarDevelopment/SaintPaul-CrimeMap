import { NextRequest, NextResponse } from 'next/server';
import { CacheInvalidationService } from '@/lib/cacheInvalidation';

interface DataChangeWebhookPayload {
  collection: string;
  operation: 'insert' | 'update' | 'delete';
  documentId?: string;
  affectedFields?: string[];
  metadata?: {
    month?: string;
    year?: string;
    crimeType?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
  timestamp?: number;
  source?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: DataChangeWebhookPayload = await request.json();

    // Add timestamp if not provided
    if (!payload.timestamp) {
      payload.timestamp = Date.now();
    }

    console.log('🔔 Received data change webhook:', payload);

    // Validate required fields
    if (!payload.collection || !payload.operation) {
      return NextResponse.json(
        { error: 'Missing required fields: collection, operation' },
        { status: 400 }
      );
    }

    // Process the data change event
    const result = await CacheInvalidationService.invalidateByDataChange({
      ...payload,
      timestamp: payload.timestamp!,
    });

    // Log the results
    console.log('🔄 Cache invalidation results:', result);

    // Return success response with invalidation details
    return NextResponse.json({
      success: true,
      message: 'Data change processed successfully',
      invalidation: {
        invalidated: result.invalidated,
        refreshed: result.refreshed,
        errors: result.errors,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to process data change webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint for webhook
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/data-change',
    methods: ['POST'],
    description: 'Cache invalidation webhook for data changes',
    timestamp: new Date().toISOString(),
  });
}
