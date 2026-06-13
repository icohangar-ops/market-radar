import { set } from '@forge/kvs';
import crypto from '@forge/crypto';

// HMAC webhook verification. Set WEBHOOK_SECRET in Forge app storage.
// POST requests must include an X-Webhook-Signature header: hex(sha256(secret + body))
export async function handler(request) {
  if (request.method !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  try {
    const body = await request.json();
    const rawBody = JSON.stringify(body);

    // HMAC signature verification — FAIL CLOSED. This endpoint overwrites the
    // shared market-radar dataset, so an unsigned/unverifiable request must be
    // rejected. A missing secret is a server misconfiguration, not a bypass.
    const signature = request.headers.get('x-webhook-signature');
    const secret = process.env.WEBHOOK_SECRET || '';

    if (!secret) {
      console.error('[market-radar] WEBHOOK_SECRET is not configured; rejecting webhook (fail-closed).');
      return { status: 503, body: { error: 'Webhook verification not configured' } };
    }
    if (!signature) {
      return { status: 401, body: { error: 'Missing X-Webhook-Signature header' } };
    }
    const expected = await crypto.sha256().update(secret + rawBody).digest().then(h => h.toHex());
    if (signature !== expected) {
      return { status: 401, body: { error: 'Invalid webhook signature' } };
    }

    // Validate required fields
    if (!body.sentiment || !body.fedPolicy || !body.sectorRotation) {
      return {
        status: 400,
        body: {
          error: 'Missing required fields: sentiment, fedPolicy, sectorRotation',
        },
      };
    }

    // Store with timestamp
    await set('market-radar-data', {
      data: {
        lastUpdated: new Date().toISOString(),
        ...body,
      },
      timestamp: Date.now(),
    });

    return {
      status: 200,
      body: { success: true, message: 'Market radar data updated' },
    };
  } catch (e) {
    return {
      status: 400,
      body: { error: 'Invalid JSON body' },
    };
  }
}
