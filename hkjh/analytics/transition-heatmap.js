// This endpoint provides a transition heatmap matrix
// for visualizing flows between states

import { loadDeviceActivities } from '@/lib/local-data-provider';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Load device activities from local storage
    const deviceActivities = await loadDeviceActivities();
    if (!deviceActivities) {
      return res.status(404).json({ message: 'No device activities available' });
    }
    
    // Define main states to include in heatmap
    // Note: These should be the normalized states
    const states = [
      'PURCHASE_RECEIPT',
      'MIS_INWARD',
      'KIF_REPORT',
      'FACTORY_MASTER',
      'OUTWARD_MIS',
      'STOCK_TRANSFER', // Remove this if you want to exclude stock transfer data
      'CALL_CLOSED',
      'UNKNOWN'
    ];
    
    // Mapping from actual activity types to normalized categories based on Inventory Logs Evaluation
    const stateMapping = {
      // Map actual observed activity types to standard states
      
      // Purchase Receipt Report
      'PURCHASE_RECEIPT': 'PURCHASE_RECEIPT',
      'PURCHASED': 'PURCHASE_RECEIPT',
      'NEW_INWARDED': 'PURCHASE_RECEIPT',
      'INWARDED': 'PURCHASE_RECEIPT',
      
      // MIS_INWARD Report
      'MIS_INWARD': 'MIS_INWARD',
      'RECEIVED_DAMAGED_FROM_HUB': 'MIS_INWARD',
      'RETURN_INWARDED': 'MIS_INWARD',
      'EXREPAIR_INWARDED': 'MIS_INWARD',
      'RECEIVED_DAMAGED_FROM_ERC': 'MIS_INWARD',
      'FAILED_REPAIR_INWARDED': 'MIS_INWARD',
      'BANK_INWARDED': 'MIS_INWARD',
      
      // KIF Report
      'KIF_REPORT': 'KIF_REPORT',
      'NEED_PREPARATION': 'KIF_REPORT',
      
      // Factory Master
      'FACTORY_MASTER': 'FACTORY_MASTER', 
      'PREPARATION_IN_PROGRESS': 'FACTORY_MASTER',
      'PREPARED': 'FACTORY_MASTER',
      'SENT_FOR_REPAIR': 'FACTORY_MASTER',
      'REPAIRED': 'FACTORY_MASTER',
      'FACTORY_INWARDED': 'FACTORY_MASTER',
      
      // Outward MIS Report
      'OUTWARD_MIS': 'OUTWARD_MIS',
      'DISPATCHED_TO_HUB': 'OUTWARD_MIS',
      'DISPATCHED_DIRECTLY_TO_MERCHANT': 'OUTWARD_MIS',
      'EXTERNAL_REPAIR': 'OUTWARD_MIS',
      'DISPATCHED_TO_ERC': 'OUTWARD_MIS',
      'DISPATCHED_TO_BANK': 'OUTWARD_MIS',
      'DISPATCHED_FOR_SD': 'OUTWARD_MIS',
      
      // Stock Transfer Report
      'STOCK_TRANSFER': 'STOCK_TRANSFER',
      'RETURN_DISPATCHED': 'STOCK_TRANSFER',
      'RETURNED_TO_HUB': 'STOCK_TRANSFER',
      'STOCK_TRANSFERRED': 'STOCK_TRANSFER',
      
      // Call Closed Report
      'CALL_CLOSED': 'CALL_CLOSED',
      'READY_TO_INSTALL': 'CALL_CLOSED',
      'HANDED_TO_FSE': 'CALL_CLOSED',
      'NEW_INSTALLED': 'CALL_CLOSED',
      'REPLACEMENT_INSTALLED': 'CALL_CLOSED',
      'REPLACEMENT_PICKED': 'CALL_CLOSED',
      'DEINSTALLED': 'CALL_CLOSED',
      'Call_Closed': 'CALL_CLOSED',
      'Call Closed': 'CALL_CLOSED',
      'CLOSED': 'CALL_CLOSED',
      'Call_Complete': 'CALL_CLOSED',
      'CALL_COMPLETE': 'CALL_CLOSED',
      'CALL_COMPLETED': 'CALL_CLOSED',
      'COMPLETED': 'CALL_CLOSED',
      'FINISHED': 'CALL_CLOSED'
    };
    
    // Initialize transition matrix
    const transitionMatrix = {};
    states.forEach(fromState => {
      transitionMatrix[fromState] = {};
      states.forEach(toState => {
        transitionMatrix[fromState][toState] = 0;
      });
    });
    
    // Count transitions
    let mappedTransitionCount = 0;
    let unmappedTransitions = new Set();
    
    Object.values(deviceActivities).forEach(activities => {
      if (!Array.isArray(activities) || activities.length < 2) return;
      
      // Sort by timestamp to ensure correct transition sequence
      const sortedActivities = [...activities].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Track transitions
      for (let i = 0; i < sortedActivities.length - 1; i++) {
        let fromState = sortedActivities[i].activity_type;
        let toState = sortedActivities[i + 1].activity_type;
        
        // Map states to standard values
        const mappedFromState = stateMapping[fromState] || fromState;
        const mappedToState = stateMapping[toState] || toState;
        
        // Keep track of unmapped transitions for debugging
        if (!stateMapping[fromState]) unmappedTransitions.add(fromState);
        if (!stateMapping[toState]) unmappedTransitions.add(toState);
        
        // Only count transitions between known states
        if (states.includes(mappedFromState) && states.includes(mappedToState)) {
          transitionMatrix[mappedFromState][mappedToState] += 1;
          mappedTransitionCount++;
        }
      }
    });
    
    // Format results for the frontend
    const headers = states.map(state => {
      // Format state names for display
      return state.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    });
    
    const rows = states.map((fromState, rowIndex) => {
      const values = states.map((toState) => {
        return transitionMatrix[fromState][toState];
      });
      
      return {
        name: headers[rowIndex],
        values: values
      };
    });
    
    const result = {
      headers,
      rows
    };
    
    return res.status(200).json(result);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while generating transition heatmap data' });
  }
} 