// API Status Check endpoint
// This endpoint returns information about the API configuration and status

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get environment information
  const info = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'Not defined',
    apiRoutes: {
      summary: '/api/analytics/summary',
      stateDistribution: '/api/analytics/state-distribution',
      stateTransitions: '/api/analytics/state-transitions',
      journeyFunnel: '/api/analytics/journey-funnel',
      activityTimeline: '/api/analytics/activity-timeline',
      stateDuration: '/api/analytics/state-duration',
      deviceAnomalies: '/api/analytics/device-anomalies-summary',
    },
    requestInfo: {
      url: req.url,
      method: req.method,
      headers: req.headers,
    },
    message: 'API routes are configured and working correctly',
  };

  return res.status(200).json(info);
} 