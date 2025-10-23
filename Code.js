function onOpen() {
  DocumentApp.getUi()
    .createMenu("Kairos")
    .addItem("Open Sidebar", "showSidebar")
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("Sidebar")
    .setTitle("Kairos for Personalized Learning")
    .setWidth(400);
  DocumentApp.getUi().showSidebar(html);
}

function getUserEmail() {
  var user_email = "teacher1@gmail.com"; // Session.getActiveUser().getEmail()
  const identity_url =
    "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/identity-fetch";

  const payload = {
    email_id: user_email,
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    followRedirects: true,
  };

  const response = UrlFetchApp.fetch(identity_url, options);
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error(
      "Identity fetch failed: HTTP " +
        status +
        " — " +
        response.getContentText()
    );
  }
}

  function showStandardsDialogAndReturn() {
    const html = HtmlService.createHtmlOutputFromFile('StandardsDialog')
      .setWidth(900)
      .setHeight(700);
    
    // Show dialog and wait for it to close
    const ui = DocumentApp.getUi();
    ui.showModalDialog(html,'Select Learning Standards');
    
    // This will be called after dialog closes via onStandardsSelected
    // Return empty array initially, actual data comes through callback
    return [];
  }

  // Save selected standards in user properties
  function receiveSelectedStandardsFromDialog(selected) {
    const props = PropertiesService.getUserProperties();
    props.setProperty('SELECTED_STANDARDS', JSON.stringify(selected));
    props.setProperty('DIALOG_STATUS', 'selected');
    return true
  }
  function onDialogClosedWithoutSelection() {
  // Mark that dialog was closed without selection
  PropertiesService.getUserProperties().setProperty('DIALOG_STATUS', 'closed');
  return true;
  }
  function getDialogStatus() {
    const props = PropertiesService.getUserProperties();
    const status = props.getProperty('DIALOG_STATUS');
    if (status) {
      props.deleteProperty('DIALOG_STATUS'); // Clear after reading
      return status;
    }
    return null;
  }
  function clearSelectedStandards() {
    const props = PropertiesService.getUserProperties();
    props.deleteProperty('SELECTED_STANDARDS');
    props.deleteProperty('DIALOG_STATUS');
    return true;
  }
  // Fetch selected standards from React sidebar
  function getSelectedStandards() {
    const props = PropertiesService.getUserProperties();
    const stored = props.getProperty('SELECTED_STANDARDS');
    return stored ? JSON.parse(stored) : [];
  }

  function getLearningStandards() {
    const stored = PropertiesService.getUserProperties().getProperty('LEARNING_STANDARDS');
    return stored ? JSON.parse(stored) : null;
  }

  function onStandardsSelected(selectedStandards) {
    return selectedStandards;
  }


  function currentUser()
  {
    return Session.getActiveUser().getEmail();
  }


function validateUser() {
  const userProps = PropertiesService.getUserProperties();
  const cachedStandards = userProps.getProperty('LEARNING_STANDARDS');
  const cachedUserId = userProps.getProperty('USER_ID');
  const cachedRole = userProps.getProperty('USER_ROLE');
  const cachedTimestamp = userProps.getProperty('CACHE_TIMESTAMP');

  // Check if cache exists and is still valid
  if (cachedStandards && cachedUserId && cachedRole && !isCacheExpired(cachedTimestamp, 1)) {
    //  Cached data is still fresh (less than 1 day old)
    return {
      statusCode: 200,
      email: currentUser(),
      role: cachedRole,
    };
  }

  //  Cache is missing or expired → fetch fresh data
  const user_email = currentUser();
  const identity_url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/dev/identity-fetch';
  const payload = {
    email_id: user_email,
    request_file: "Learning_Standards.json",
  };
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(identity_url, options);
  const responseJson = JSON.parse(response.getContentText());

  if (response.getResponseCode() === 200) {
    // Save user info and fresh JSON
    userProps.setProperty('USER_ID', responseJson.user_id);
    userProps.setProperty('USER_ROLE', responseJson.role);

    const standardsResponse = UrlFetchApp.fetch(responseJson.url);
    const standardsJson = standardsResponse.getContentText();
    userProps.setProperty('LEARNING_STANDARDS', standardsJson);

    // Update cache timestamp
    userProps.setProperty('CACHE_TIMESTAMP', new Date().toISOString());
  }

  return {
    statusCode: response.getResponseCode(),
    email: user_email,
    role: responseJson.role,
  };
}

/**
 * Checks if the cache is expired.
 * @param {string} timestamp - ISO timestamp string
 * @param {number} maxAgeDays - cache validity period in days
 */
function isCacheExpired(timestamp, maxAgeDays) {
  if (!timestamp) return true; // No timestamp = expired
  const now = new Date();
  const last = new Date(timestamp);
  const diffMs = now - last;
  const maxMs = maxAgeDays * 24 * 60 * 60 * 1000; // Convert days → ms
  return diffMs > maxMs;
}


function getAdvice(prompt) {
  const baseUrl = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

function callOpenAI(prompt) {
  const baseUrl =
    "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const payload = {
    action: "advice",
    payload: { message: prompt, email_id: Session.getActiveUser().getEmail() },
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
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
    method: "POST",
    headers: { "Content-Type": "application/json" },
    payload: JSON.stringify(payload),
  };
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

/*********************************
 * API: My Projects
 *********************************/
function getTeacherProjectsAll() {
  const url =
    "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const body = {
    action: "myprojects",
    payload: {
      request: "teacher_view_all",
      email_id: "teacher1@gmail.com",
      subject_domain: "Science",
    },
  };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code < 200 || code >= 300) throw new Error("API " + code + ": " + text);

  let out;
  try {
    out = JSON.parse(text);
  } catch {
    throw new Error("Bad JSON: " + text);
  }

  let bodyLike =
    out && typeof out.body === "string" ? JSON.parse(out.body) : out.body;
  if (!bodyLike) bodyLike = out.action_response || out;

  return { statusCode: out.statusCode || out.status || 200, body: bodyLike };
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

function getStudentProjectsForTeacher() {
  return [
    {
      title: 'Climate Change Research',
      studentEmail: 'student1@example.com',
      summary: 'A summary of key climate change challenges and mitigation strategies.',
      docLink: 'https://docs.google.com/document/d/xxxxxxx',
    },
    {
      title: 'AI in Healthcare',
      studentEmail: 'student2@example.com',
      summary: 'Exploring applications of machine learning in medical diagnosis.',
      docLink: 'https://docs.google.com/document/d/yyyyyyy',
    },
  ];
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

function submitProjectDecision(projectId, userId, decision, overallComment, projectSnapshot) {
  // Sidebar-only: do not read Sheets, do not call backend.
  // Optionally accept a project snapshot from the client (React) so you can log or preview what was decided on.
  if (!projectId) {
    return { success: false, error: "Missing projectId" };
  }
  if (!userId) {
    return { success: false, error: "Missing userId" };
  }

  // If you want to enforce normalized statuses locally, you can:
  const normStatusLocal = (s) => {
    const x = String(s == null ? "" : s).trim().toLowerCase();
    if (x === "approved") return "Approved";
    if (x === "rejected" || x === "reject") return "Rejected";
    return "Pending Approval";
  };

  // Nothing is sent anywhere; just echo back what the UI sent.
  return {
    success: true,
    message: "Decision captured locally (no backend, no Sheets).",
    echo: {
      projectId: String(projectId),
      userId: String(userId),
      decision: normStatusLocal(decision),
      overallComment: String(overallComment || ""),
      // Optional: whatever your React passes as a snapshot of the project at decision time
      projectSnapshot: projectSnapshot || null,
    },
  };
}



function getTeacherProjectDetails(projectId, userId) {
  if (!projectId) return { statusCode: 400, body: { project: null, error: "Missing projectId" } };
  if (!userId)     return { statusCode: 400, body: { project: null, error: "Missing userId" } };

  const url = "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const payload = {
    action: "myprojects",
    payload: {
      request: "project_details",
      project_id: String(projectId),
      user_id: String(userId),
      email_id: "teacher1@gmail.com" // or Session.getActiveUser().getEmail()
    }
  };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    followRedirects: true
  });

  const status = res.getResponseCode();
  const text   = res.getContentText();

  if (status < 200 || status >= 300) {
    return { statusCode: status, body: { project: null, error: "Backend HTTP " + status, debug: text } };
  }

  // Safe parse helpers
  const sp = (v) => { try { return typeof v === "string" ? JSON.parse(v) : v; } catch { return null; } };
  const out  = sp(text) || {};
  const body = (out && out.body != null ? sp(out.body) : null) || out.action_response || out || {};

  // Prefer the shape you showed: action_response.json.project
  let project =
    (out.action_response && out.action_response.json && out.action_response.json.project) ||
    (body.json && body.json.project) ||
    body.project ||
    (Array.isArray(body.projects) ? body.projects[0] : null) ||
    out.project ||
    (Array.isArray(out.projects) ? out.projects[0] : null) ||
    (body.data && (body.data.project || (Array.isArray(body.data.projects) ? body.data.projects[0] : null))) ||
    null;

  // Deep fallback – scan for a project-like object
  if (!project) {
    (function findProject(o) {
      if (!o || typeof o !== "object" || project) return;
      const looks = (o.project_id || o.id) && (o.project_title || o.title) && Array.isArray(o.stages);
      if (looks) { project = o; return; }
      for (const k in o) {
        const v = o[k];
        if (Array.isArray(v)) v.forEach(findProject);
        else findProject(v);
        if (project) return;
      }
    })(body || out);
  }

  if (!project) {
    return { statusCode: out.statusCode || status || 200, body: { project: null, error: "No project found", debug: body || out } };
  }

  // Attach user_id if provided elsewhere
  if (!project.user_id && out.action_response && out.action_response.user_id) {
    project.user_id = out.action_response.user_id;
  }

  // Normalize statuses for UI
  const norm = (s) => {
    const x = String(s == null ? "" : s).trim().toLowerCase();
    if (x === "approved") return "Approved";
    if (x === "rejected" || x === "reject") return "Rejected";
    return "Pending Approval";
  };

  project.status = norm(project.status);

  // Ensure stages is an array
  const stages = Array.isArray(project.stages) ? project.stages.slice() : [];

  // 1) Normalize stage/task/gate status
  stages.forEach((st) => {
    if (!st) return;
    st.status = norm(st.status);
    if (Array.isArray(st.tasks)) {
      st.tasks.forEach((t) => { t.status = norm(t.status); });
    }
    if (st.gate) {
      st.gate.status = norm(st.gate.status);
    }
  });

  // 2) DETACH gates: remove st.gate and append { gate: {..., stage_id} } entries
  const detachedGateEntries = [];
  const normalizedStages = stages.map((st) => {
    if (st && st.gate) {
      const g = Object.assign({}, st.gate);
      if (!g.stage_id) g.stage_id = st.stage_id;       // carry stage_id for matching
      detachedGateEntries.push({ gate: g });
      const { gate, ...rest } = st;
      return rest;                                      // return stage WITHOUT gate
    }
    return st;
  });

  project.stages = normalizedStages.concat(detachedGateEntries);

  return { statusCode: out.statusCode || status || 200, body: { project } };
}

