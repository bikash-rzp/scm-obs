// This endpoint provides state transitions data for the analytics dashboard
// It processes real data from device_activities.json

import { loadDeviceActivities } from '@/lib/local-data-provider';

// Cache the result to improve performance
let cachedTransitions = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Map for normalizing state values from different sources
const STATE_MAPPING = {
  // Codes to report types
  '01A': 'PURCHASE_RECEIPT',
  '01B': 'MIS_INWARD',
  '02': 'KIF_REPORT',
  '03': 'FACTORY_MASTER',
  '04': 'OUTWARD_MIS',
  '05': 'STOCK_TRANSFER',
  '08': 'CALL_CLOSED',
  
  // Purchase Receipt
  'NEW_INWARDED': 'PURCHASE_RECEIPT',
  'INWARDED': 'PURCHASE_RECEIPT',
  
  // MIS Inward Report specific states
  'RECEIVED_DAMAGED_FROM_HUB': 'MIS_INWARD',
  'RETURN_INWARDED': 'MIS_INWARD',
  'RECEIVED_DAMAGED_FROM_ERC': 'MIS_INWARD',
  'EXREPAIR_INWARDED': 'MIS_INWARD',
  'FAILED_REPAIR_INWARDED': 'MIS_INWARD',
  'BANK_INWARDED': 'MIS_INWARD',
  
  // KIF Report
  'NEED_PREPARATION': 'KIF_REPORT',
  
  // Factory Master
  'PREPARATION_IN_PROGRESS': 'FACTORY_MASTER',
  'PREPARED': 'FACTORY_MASTER',
  'SENT_FOR_REPAIR': 'FACTORY_MASTER',
  'REPAIRED': 'FACTORY_MASTER',
  'FACTORY_INWARDED': 'FACTORY_MASTER',
  
  // Outward MIS
  'DISPATCHED_TO_HUB': 'OUTWARD_MIS',
  'DISPATCHED_DIRECTLY_TO_MERCHANT': 'OUTWARD_MIS',
  'EXTERNAL_REPAIR': 'OUTWARD_MIS',
  'DISPATCHED_TO_ERC': 'OUTWARD_MIS',
  'DISPATCHED_TO_BANK': 'OUTWARD_MIS',
  'DISPATCHED_FOR_SD': 'OUTWARD_MIS',
  
  // Stock Transfer
  'RETURN_DISPATCHED': 'STOCK_TRANSFER',
  'RETURNED_TO_HUB': 'STOCK_TRANSFER',
  'STOCK_TRANSFER': 'STOCK_TRANSFER',
  
  // Call Closed Report
  'READY_TO_INSTALL': 'CALL_CLOSED',
  'HANDED_TO_FSE': 'CALL_CLOSED',
  'NEW_INSTALLED': 'CALL_CLOSED',
  'REPLACEMENT_INSTALLED': 'CALL_CLOSED',
  'REPLACEMENT_PICKED': 'CALL_CLOSED',
  'DEINSTALLED': 'CALL_CLOSED',
  'CALL_CLOSED': 'CALL_CLOSED',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get limit from query parameter (default to 10)
    const limit = parseInt(req.query.limit, 10) || 10;
    
    // Return cached result if available and not expired
    const now = Date.now();
    if (cachedTransitions && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
      const limitedResult = cachedTransitions.slice(0, limit);
      return res.status(200).json(limitedResult);
    }
    
    console.log('Calculating state transitions...');
    
    // Load device activities
    const deviceActivities = await loadDeviceActivities();
    if (!deviceActivities) {
      return res.status(404).json({ error: 'No device activities data available' });
    }
    
    // Track state transitions
    const transitionCounts = new Map();
    
    // Process all device activities
    Object.entries(deviceActivities).forEach(([dsn, activities]) => {
      if (!Array.isArray(activities) || activities.length < 2) return;
      
      // Sort activities by timestamp
      const sortedActivities = [...activities].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Track transitions for this device
      for (let i = 0; i < sortedActivities.length - 1; i++) {
        const currentActivity = sortedActivities[i];
        const nextActivity = sortedActivities[i + 1];
        
        // Skip if either activity doesn't have a state
        if (!currentActivity.activity_type || !nextActivity.activity_type) continue;
        
        // Get normalized state values
        const fromState = STATE_MAPPING[currentActivity.activity_type] || currentActivity.activity_type;
        const toState = STATE_MAPPING[nextActivity.activity_type] || nextActivity.activity_type;
        
        // Skip self-transitions (same state to same state)
        if (fromState === toState) continue;
        
        // Create a unique key for this transition
        const transitionKey = `${fromState}|${toState}`;
        
        // Increment the count for this transition
        transitionCounts.set(transitionKey, (transitionCounts.get(transitionKey) || 0) + 1);
      }
    });
    
    // Convert to array format for response
    const transitions = Array.from(transitionCounts.entries())
      .map(([key, count]) => {
        const [fromState, toState] = key.split('|');
        
        // Format state names for display
        const fromName = fromState.replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        const toName = toState.replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        return {
          from: fromState,
          to: toState,
          fromName,
          toName,
          count,
          label: `${fromName} → ${toName}`
        };
      })
      // Sort by count in descending order
      .sort((a, b) => b.count - a.count);
    
    console.log(`Generated ${transitions.length} distinct state transitions`);
    
    // Cache the result
    cachedTransitions = transitions;
    cacheTimestamp = now;
    
    // Return limited result
    const limitedResult = transitions.slice(0, limit);
    return res.status(200).json(limitedResult);
  } catch (error) {
    console.error('Error in state transitions API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 