function getAdvice(prompt) {
  const baseUrl = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

  const payload = {
    action: "advice",
    payload: {
      message: prompt,
      email_id: currentUser(),
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(baseUrl, options);
    const result = JSON.parse(response.getContentText());

    return result;
  } catch (error) {
    Logger.log("❌ Error fetching from OpenAI Lambda:");
    Logger.log(error);
    return {
      recommendation: {
        advice: "No response available",
        subject: "",
        connection: "",
        examples: [],
        resources: []
      }
    };
  }
}

function lockProject(projectData) {
  const baseUrl = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke'
  Logger.log(projectData)
  try {  
    
    // Prepare the data for the API call
    const payload = {
      action: "saveproject",
      payload: {
        json: {
          project:projectData
        },
        user_id: "23e228fa-4592-4bdc-852e-192973c388ce",
        email_id: 'mindspark.user1@schoolfuel.org',
      },
    };

    //Logger.log(JSON.stringify(payload))

    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
    
    // Make the API call to the backend
    const response = UrlFetchApp.fetch(baseUrl, options);

    const responseData = JSON.parse(response.getContentText());

    
    // Handle different response codes
    return {
      success: true,
      message: responseData.action_response.response || 'Project successfully locked and submitted for review!',
    }
    
  } catch (error) {
    console.error('Error in lockProject function:', error);
    
    // Handle different types of errors
    if (error.toString().includes('DNS error')) {
      return {
        success: false,
        message: 'Network connection error. Please check your internet connection.'
      };
    } else if (error.toString().includes('timeout')) {
      return {
        success: false,
        message: 'Request timed out. Please try again.'
      };
    } else {
      return {
        success: false,
        message: 'An unexpected error occurred. Please contact support if the problem persists.'
      };
    }
  }
}

function getStudentProjects(){
  try {
    const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

    const payload = {
      action: "myprojects",
      payload:{
        user_id:"23e228fa-4592-4bdc-852e-192973c388ce",
        request:"student_view_all"
      }
    }

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
    
    const response = UrlFetchApp.fetch(url, options);
    
    // Check if the HTTP request itself failed
    if (response.getResponseCode() !== 200) {
      throw new Error(`HTTP Error: ${response.getResponseCode()} - ${response.getContentText()}`);
    }
    
    const result = JSON.parse(response.getContentText());
    
    // Check if the API returned an error in the response body
    if (!result || result.status !== "success") {
      throw new Error(`API Error: ${result?.status || 'Unknown'} - ${result?.message || 'Unknown error'}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in getStudentProjects:', error);
    // Return an error object that your React component can handle
    return {
      statusCode: 500,
      error: error.toString(),
      body: null
    };
  }
}

function getProjectDetails(projectId){
  try {
    const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

    const payload = {
      action: "myprojects",
      payload:{
        user_id:"23e228fa-4592-4bdc-852e-192973c388ce",
        project_id:projectId,
        request:"project_details"
      }
    }

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
    
    const response = UrlFetchApp.fetch(url, options);
    
    // Check if the HTTP request itself failed
    if (response.getResponseCode() !== 200) {
      throw new Error(`HTTP Error: ${response.getResponseCode()} - ${response.getContentText()}`);
    }
    
    const result = JSON.parse(response.getContentText());
    
    // Check if the API returned an error in the response body
    if (!result || result.status !== "success") {
      throw new Error(`API Error: ${result?.status || 'Unknown'} - ${result?.message || 'Unknown error'}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in getStudentProjects:', error);
    // Return an error object that your React component can handle
    return {
      statusCode: 500,
      error: error.toString(),
      body: null
    };
  }
}

function processDailyCheckin(userInput) {
  const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';
  
  const payload = {
    action: "morningpulse",
    payload: {
      email_id: Session.getActiveUser().getEmail(),
      emoji: userInput.emoji,
      route: "daily-checkin",
      message: userInput.message
    }
  };
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);

    console.log('API Response Status:', JSON.stringify(response));
    
    const result = JSON.parse(response.getContentText());
    console.log('API Response:', result);
    if( result.statusCode == 200)
      console.log("status 200 received")
    
    // Return the project data or fallback message
    return JSON.parse(JSON.stringify(result?.action_response?.response)) || "No response available";
  } catch (error) {
    console.error('Error processing daily check-in:', error.toString());
    
    // Return a fallback response instead of throwing
    const fallbackResponses = [
      "Thank you for your daily check-in! Keep up the great work! 🌟",
      "Great job starting your day with intention! 🌟",
      "Your mindful check-in sets a positive tone for the day ahead! ✨",
      "Thank you for taking a moment to reflect. Keep up the amazing work! 💪"
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

function callAIServiceInitiation(userInput) {
  console.log("this is from callAIServiceInitiation");
  const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';
  
  const payload = {
    action: "guideme",
    payload: {
      email_id: Session.getActiveUser().getEmail(),
      message: userInput.message,
      context: {
        mode: userInput.context.mode,
        focus: userInput.context.focus,
        course: userInput.context.course,
        grade: userInput.context.grade,
        readingLevel: userInput.context.readingLevel,
        standards: userInput.context.standards,
        pastedContent: userInput.context.pastedContent
      }
    }
  }; 
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    console.log('API Response Status from GuideMe Initiation:', response.getResponseCode());
    
    const result = JSON.parse(response.getContentText());
    console.log('API Response Initiation:', result);
    
    if (result.statusCode == 200) {
      console.log("status 200 received");
    }
    
    // Check if the response has the expected structure
    if (result.status === "success" && result.action_response) {
      // Return the properly structured response that matches what your frontend expects
      return {
        message: result.action_response.response,
        conversation_id: result.action_response.conversation_id,
        generatedAt: result.action_response.generatedAt,
        citations: [] // Add empty citations array if not provided by backend
      };
    } else {
      // Return error structure
      return {
        error: "Invalid response structure",
        message: "No response available"
      };
    }
    
  } catch (error) {
    console.error('Error processing AI initiation request:', error.toString());
    // Return error structure that frontend can handle
    return {
      error: error.toString(),
      message: "Error connecting to AI service"
    };
  }
}

function callAIServiceContinue(userInput) {
  console.log("this is from callAIServiceContinue");
  const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';
  
  const payload = {
    action: "guideme",
    payload: {
      email_id: Session.getActiveUser().getEmail(),
      message: userInput.message,
      conversation_id: userInput.conversation_id
    }
  }; 
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    console.log('API Response Status from GuideMe Continue:', response.getResponseCode());
    
    const result = JSON.parse(response.getContentText());
    console.log('API Response Continue:', result);
    
    if (result.statusCode == 200) {
      console.log("status 200 received");
    }
    
    // Check if the response has the expected structure
    if (result.status === "success" && result.action_response) {
      // Return the properly structured response that matches what your frontend expects
      return {
        message: result.action_response.response,
        conversation_id: result.action_response.conversation_id,
        generatedAt: result.action_response.generatedAt,
        citations: [] // Add empty citations array if not provided by backend
      };
    } else {
      // Return error structure
      return {
        error: "Invalid response structure",
        message: "No response available"
      };
    }
    
  } catch (error) {
    console.error('Error processing AI continue request:', error.toString());
    // Return error structure that frontend can handle
    return {
      error: error.toString(),
      message: "Error connecting to AI service"
    };
  }
}

function findExperts(input) {
  const baseUrl = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';
  const payload = {
    action: "helpme",
    payload: {
      message: input.message,
      geolocation: input.geolocation,
      email_id: currentUser(),
    }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(baseUrl, options);
    const result = JSON.parse(response.getContentText());
    Logger.log(result);
    return result;
  } catch (error) {
    Logger.log('Error finding experts: ' + error.toString());
    throw error;
  }
}

function submitAboutMeInfo(input){
  const baseUrl = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke'

  const payload = {
    action: "aboutme",
    payload: input
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  try {
    const response = UrlFetchApp.fetch(baseUrl, options);
    const result = JSON.parse(response.getContentText());
    Logger.log(result);
    if (result.status == 'success'){
      Logger.log('✅ About Me info submitted successfully.');
      return { success: true, message: result.action_response.message };
    } else{
      Logger.log('❌ Failed to submit About Me info: ' + JSON.stringify(result));
      return { success: false, message: result.action_response?.message || 'Unknown error' };
    }
  } catch (error) {
    Logger.log('Error submitting about me info: ' + error.toString());
    throw error;
  }
}

function callMorningPulseAPI(payload) {
  const baseUrl = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(baseUrl, options);
    const result = JSON.parse(response.getContentText());
    Logger.log('Morning pulse API response:', result);
    return result;
  } catch (error) {
    console.error('Error calling morning pulse API:', error);
    throw error;
  }
}
