function onOpen() {
    DocumentApp.getUi()
      .createMenu('Kairos')
      .addItem('Open Sidebar', 'showSidebar')
      .addToUi();
  }
  
  function showSidebar() {
    const html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle("Kairos for Personalized Learning")
      .setWidth(400);
    DocumentApp.getUi().showSidebar(html);
  }


  function currentUser()
  {
    return Session.getActiveUser().getEmail();
  }


function validateUser() {

  var userProperties = PropertiesService.getUserProperties();
  const user_email =  currentUser()
  const identity_url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/identity-fetch';
  const payload = {
    email_id: user_email,
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
    userProperties.setProperty('USER_ID', responseJson.user_id);
    userProperties.setProperty('USER_ROLE', responseJson.role);
  }

  return {
    statusCode: response.getResponseCode(),
    email: user_email,
    role: responseJson.role,
  };
}

function openDialog(dialogType, title){
  const html = HtmlService.createHtmlOutputFromFile('Dialog')
    .setWidth(900)
    .setHeight(700);
  
  // Set the hash BEFORE opening the dialog
  const htmlWithHash = html.getContent();
  const modifiedHtml = HtmlService.createHtmlOutput(
    htmlWithHash.replace('<body>', `<body><script>window.location.hash = '${dialogType}';</script>`)
  )
    .setWidth(900)
    .setHeight(700);
  
  DocumentApp.getUi().showModalDialog(modifiedHtml, title);
}

function openPrototypeDialog(projectId) {
  const html = HtmlService.createHtmlOutputFromFile('Dialog')
    .setWidth(900)
    .setHeight(700);

  const htmlWithHash = html.getContent();
  const modifiedHtml = HtmlService.createHtmlOutput(
    htmlWithHash.replace(
      '<body>',
      `<body><script>
        window.location.hash = 'project-dashboard';
        window.PROJECT_ID = '${projectId || ''}';
      </script>`
    )
  )
    .setWidth(900)
    .setHeight(700);

  DocumentApp.getUi().showModalDialog(modifiedHtml, 'Project Prototype');
}


// Specific function to open Teacher Project Queue dialog
function openTeacherProjectQueue() {
  openDialog('teacher-project-queue', 'Teacher Project Queue');
}

// Specific function to open Teacher Gate Assessment dialog
function openTeacherGateAssessment() {
  openDialog('teacher-gate-assessment', 'Gate Assessment');
}

function clearUserCache() {
  const p = PropertiesService.getUserProperties();
  ['LEARNING_STANDARDS','USER_ID','USER_ROLE','CACHE_TIMESTAMP','USER_EMAIL','SELECTED_STANDARDS','DIALOG_STATUS']
    .forEach(k => p.deleteProperty(k));
  return true;
}

const API_ENDPOINT_DIALOG = "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";

function postToBackend(payloadInput) {
  try {
    let payload = payloadInput;
    if (typeof payloadInput === "string") {
      try { payload = JSON.parse(payloadInput); } catch (e) {}
    }

    // 🟢 Always use MindSpark email for backend calls
    const fallbackEmail = "mindspark.user1@schoolfuel.org";
    if (payload && payload.payload) {
      if (!payload.payload.actor) payload.payload.actor = {};
      payload.payload.actor.email_id =
        payload.payload.actor.email_id || fallbackEmail;
    }

    // 🧩 Log minimal info for debug
    const ids = payload?.payload?.ids || {};
    console.log("📤 Final payload to AWS:", JSON.stringify({
      action: payload?.action,
      actor: payload?.payload?.actor,
      ids
    }, null, 2));

    // ✅ If task delete, ensure task_id exists
    if (payload?.action === "deleterequest" && ids?.entity_type === "task") {
      console.log("✅ TASK DELETE ids:", JSON.stringify(ids, null, 2));
      if (!ids.task_id) {
        console.error("❌ Aborting send: missing task_id");
        return JSON.stringify({ status: "error", message: "Missing task_id" });
      }
    }

    const res = UrlFetchApp.fetch(API_ENDPOINT, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const text = res.getContentText();
    console.log("✅ AWS response:", res.getResponseCode(), text);
    return text;
  } catch (error) {
    console.error("❌ postToBackend error:", error);
    return JSON.stringify({ status: "error", message: error.toString() });
  }
}


const API_ENDPOINT = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

function sendDeleteToBackend(payload) {
  try {
    // Normalize the payload container
    if (!payload || typeof payload !== 'object') payload = {};
    if (!payload.payload) payload.payload = {};
    if (!payload.payload.actor) payload.payload.actor = {};

    // 🟢 Always force the correct SchoolFuel email
    const fixedEmail = 'mindspark.user1@schoolfuel.org';
    payload.payload.actor.email_id = fixedEmail;

    // Debug logging (sanitized)
    const toLog = {
      action: payload.action,
      actor: {
        email_id: payload.payload.actor.email_id,
        user_id: payload.payload.actor.user_id,
      },
      ids: payload.payload.ids,
    };
    console.log('📤 TASK/PROJECT delete request (sanitized):', JSON.stringify(toLog, null, 2));

    // 🚧 Validation for task deletes
    const ids = payload.payload.ids || {};
    if (ids.entity_type === 'task' && !ids.task_id) {
      console.error('❌ Refusing to send: task delete without task_id', JSON.stringify(ids, null, 2));
      return { status: 'failed', error: 'Missing task_id for task delete' };
    }

    // Prepare fetch options
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    // Send to backend
    const res = UrlFetchApp.fetch(API_ENDPOINT, options);
    console.log('sendDeleteToBackend response:', res.getResponseCode(), res.getContentText());

    return {
      status: 'ok',
      code: res.getResponseCode(),
      body: res.getContentText(),
    };

  } catch (e) {
    console.error('sendDeleteToBackend error:', e);
    throw e.toString();
  }
}


// Report a bug or issue code:
function reportGuideMeBug(bugInput) {
  try {
    // Normalize incoming data from React
    if (!bugInput || typeof bugInput !== 'object') {
      throw new Error('Invalid bug payload from client');
    }

    var userProperties = PropertiesService.getUserProperties();

    // Try to get USER_ID from cache
    var userId = userProperties.getProperty('USER_ID');

    // If missing, try to validate and populate
    if (!userId) {
      try {
        validateUser();
        userId = userProperties.getProperty('USER_ID');
      } catch (e) {
        // If validateUser fails, we still proceed without userId
        console.error('validateUser failed in reportGuideMeBug:', e);
      }
    }

    // Email used in payload.email_id
    // (backend sample uses email_id at this level)
    var email = userProperties.getProperty('USER_EMAIL') || currentUser();

    // Fallbacks / defaults
    var title = bugInput.title || 'Guide Me Bug Report';
    var description = bugInput.description || '';
    var priority = bugInput.priority || 'medium';
    var topic = bugInput.topic || 'bug';
    var notifyEmail = (bugInput.notify_email === false || bugInput.notify_email === 'false')
      ? 'false'
      : 'true'; // default true

    // Build payload exactly in the shape backend expects,
    // plus an "actor" object so postToBackend can add the MindSpark email.
    var payload = {
      action: 'guideme',
      payload: {
        request: 'report',
        email_id: email,
        report_request: {
          user_id: userId || '',
          topic: topic,
          title: title,
          description: description,
          priority: priority,
          status: 'open',
          notify_email: notifyEmail
        },
        // actor is used only by postToBackend to attach the mapped email
        actor: {
          user_id: userId || ''
        }
      }
    };

    // Log a sanitized view
    console.log('📨 reportGuideMeBug payload:', JSON.stringify({
      action: payload.action,
      email_id: payload.payload.email_id,
      report_request: payload.payload.report_request
    }, null, 2));

    // Reuse your existing backend helper
    var backendResponseText = postToBackend(payload);

    var parsed;
    try {
      parsed = JSON.parse(backendResponseText);
    } catch (e) {
      parsed = { raw: backendResponseText };
    }

    return parsed || { status: 'ok' };
  } catch (e) {
    console.error('❌ reportGuideMeBug error:', e);
    return {
      status: 'error',
      message: e.toString()
    };
  }
}

