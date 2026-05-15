import { set } from '@forge/kvs';

export async function handler(request) {
  if (request.method !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  try {
    const body = await request.json();

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
