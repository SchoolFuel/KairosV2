// ==================== IGNITEHELP TICKETING FUNCTIONS ====================

/**
 * Transform user_history from API format to ticket format for frontend
 */
function transformUserHistoryToTickets(userHistory) {
  if (!Array.isArray(userHistory)) {
    return [];
  }
  
  return userHistory.map((item, index) => {
    // Map topicKey back to topic name for display
    const topicKeyToName = {
      'bug': 'Login Issue',
      'submission': 'Submission Problem',
      'standards': 'Learning Standards',
      'account': 'Account Access',
      'other': 'Other'
    };
    
    const topicName = topicKeyToName[item.topic] || item.topic || 'Other';
    
    return {
      id: item.request_id || `history-${index}`,
      title: topicName,
      category: topicName, // Use topic as category
      priority: 'Normal', // Default priority since not in history
      status: 'Resolved', // Assume resolved if in history
      created: item.created_at ? item.created_at.split(' ')[0] : new Date().toISOString().split('T')[0],
      creator: item.email || '',
      description: item.description || ''
    };
  });
}

/**
 * Get all tickets for the current user
 * Uses the same submit_help endpoint to get user_history
 */
function getTickets() {
  try {
    const userEmail = currentUser();
    const userProps = PropertiesService.getUserProperties();
    const userId = userProps.getProperty('USER_ID');
    
    if (!userId) {
      return {
        success: false,
        message: 'User ID not found. Please refresh and try again.',
        tickets: []
      };
    }

    const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

    // Call submit_help with query_only flag to get user history without creating a ticket
    // If API doesn't support query_only, it will still return history but might create a minimal ticket
    // Alternative: Check if API has a separate endpoint for history-only queries
    const payload = {
      route: "submit_help",
      user_id: userId,
      email: userEmail,
      topicKey: "other", // Use generic topic
      description: "", // Empty description - hoping API won't create ticket if empty
      priority: "normal",
      notify: false,
      query_only: true // Flag to indicate we only want history, not to create a ticket
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      Logger.log('Error parsing response: ' + e.toString());
      return {
        success: false,
        message: 'Failed to parse API response',
        tickets: []
      };
    }

    if (response.getResponseCode() === 200 && result.status === "success") {
      const data = result.data || {};
      const userHistory = data.user_history || [];
      
      // Transform user_history to ticket format
      const tickets = transformUserHistoryToTickets(userHistory);
      
      return {
        success: true,
        tickets: tickets
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to fetch tickets',
        tickets: []
      };
    }
  } catch (error) {
    Logger.log('Error fetching tickets: ' + error.toString());
    return {
      success: false,
      message: error.toString(),
      tickets: []
    };
  }
}

/**
 * Map topic to topicKey for API
 */
function mapTopicToKey(topic) {
  const topicMap = {
    'Submission Problem': 'submission',
    'Login Issue': 'bug', // Login issues are typically bugs
    'Learning Standards': 'standards',
    'Account Access': 'account',
    'Other': 'other'
  };
  // Try to match by exact name first
  if (topicMap[topic]) {
    return topicMap[topic];
  }
  // Fallback: lowercase and replace spaces with underscores
  return topic.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Create a new support ticket
 */
function createTicket(ticketData) {
  try {
    const userEmail = currentUser();
    const userProps = PropertiesService.getUserProperties();
    const userId = userProps.getProperty('USER_ID');
    
    if (!userId) {
      return {
        success: false,
        message: 'User ID not found. Please refresh and try again.'
      };
    }

    // Map topic to topicKey
    const topicKey = mapTopicToKey(ticketData.topic || ticketData.title);
    
    // Normalize priority to lowercase
    const priority = (ticketData.priority || 'normal').toLowerCase();
    
    // Get notify flag (default to true if not provided)
    const notify = ticketData.notifyMe !== undefined ? ticketData.notifyMe : true;

    const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

    const payload = {
      route: "submit_help",
      user_id: userId,
      email: userEmail,
      topicKey: topicKey,
      description: ticketData.description || '',
      priority: priority,
      notify: notify
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      Logger.log('Error parsing response: ' + e.toString());
      return {
        success: false,
        message: 'Failed to parse API response',
        data: null
      };
    }

    if (response.getResponseCode() === 200 && result.status === "success") {
      return {
        success: true,
        data: result.data || {},
        message: result.data?.message || 'Ticket created successfully!'
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to create ticket',
        data: null
      };
    }
  } catch (error) {
    Logger.log('Error creating ticket: ' + error.toString());
    return {
      success: false,
      message: error.toString(),
      data: null
    };
  }
}

/**
 * Get ticket details by ID
 */
function getTicketDetails(ticketId) {
  try {
    const userEmail = currentUser();
    const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

    const payload = {
      action: "tickets",
      payload: {
        request: "details",
        email_id: userEmail,
        ticket_id: ticketId
      }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200 && result.status === "success") {
      return {
        success: true,
        ticket: result.action_response.ticket
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to fetch ticket details'
      };
    }
  } catch (error) {
    Logger.log('Error fetching ticket details: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Update ticket status
 */
function updateTicketStatus(ticketId, newStatus, resolution) {
  try {
    const userEmail = currentUser();
    const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

    const payload = {
      action: "tickets",
      payload: {
        request: "update_status",
        email_id: userEmail,
        ticket_id: ticketId,
        status: newStatus,
        resolution: resolution || ''
      }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200 && result.status === "success") {
      return {
        success: true,
        message: 'Ticket status updated successfully!'
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to update ticket status'
      };
    }
  } catch (error) {
    Logger.log('Error updating ticket status: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Search for similar resolved tickets
 */
function searchSimilarTickets(category, searchTerm) {
  try {
    const userEmail = currentUser();
    const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

    const payload = {
      action: "tickets",
      payload: {
        request: "search_similar",
        email_id: userEmail,
        category: category,
        search_term: searchTerm,
        status: 'Resolved'
      }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200 && result.status === "success") {
      return {
        success: true,
        tickets: result.action_response.similar_tickets || []
      };
    } else {
      return {
        success: false,
        tickets: []
      };
    }
  } catch (error) {
    Logger.log('Error searching similar tickets: ' + error.toString());
    return {
      success: false,
      tickets: []
    };
  }
}

/**
 * Add comment to a ticket
 */
function addTicketComment(ticketId, comment) {
  try {
    const userEmail = currentUser();
    const userProps = PropertiesService.getUserProperties();
    const userRole = userProps.getProperty('USER_ROLE');

    const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

    const payload = {
      action: "tickets",
      payload: {
        request: "add_comment",
        email_id: userEmail,
        ticket_id: ticketId,
        comment: comment,
        commenter_role: userRole,
        created: new Date().toISOString()
      }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200 && result.status === "success") {
      return {
        success: true,
        message: 'Comment added successfully!'
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to add comment'
      };
    }
  } catch (error) {
    Logger.log('Error adding comment: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Get possible resolutions from Ignite Spark
 * Uses the same submit_help endpoint which returns possible solutions
 * @param {string} topic - The topic/category of the issue
 * @param {string} description - Description of the issue
 * @returns {Object} Response with possible solutions
 */
function getPossibleResolutions(topic, description) {
  try {
    const userEmail = currentUser();
    const userProps = PropertiesService.getUserProperties();
    const userId = userProps.getProperty('USER_ID');
    
    if (!userId) {
      return {
        success: false,
        message: 'User ID not found. Please refresh and try again.',
        solutions: []
      };
    }

    // Map topic to topicKey
    const topicKey = mapTopicToKey(topic);
    
    // Use default priority and notify for instant help
    const priority = 'normal';
    const notify = true;

    const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

    const payload = {
      route: "submit_help",
      user_id: userId,
      email: userEmail,
      topicKey: topicKey,
      description: description || '',
      priority: priority,
      notify: notify
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      Logger.log('Error parsing response: ' + e.toString());
      return {
        success: false,
        message: 'Failed to parse API response',
        solutions: []
      };
    }

    if (response.getResponseCode() === 200 && result.status === "success") {
      const data = result.data || {};
      const solutions = data.possible_solutions || [];
      
      return {
        success: true,
        requestId: data.request_id || null,
        solutions: solutions.map(sol => ({
          title: sol.title || '',
          url: sol.url || '',
          tags: sol.tags || ''
        })),
        message: data.message || 'Possible resolutions found',
        userHistory: data.user_history || [],
        similarResolutions: data.similar_resolutions || []
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to get possible resolutions',
        solutions: []
      };
    }
  } catch (error) {
    Logger.log('Error getting possible resolutions: ' + error.toString());
    return {
      success: false,
      message: error.toString(),
      solutions: []
    };
  }
}

