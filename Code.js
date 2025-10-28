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
  clearUserCache()
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

function clearUserCache() {
  const p = PropertiesService.getUserProperties();
  ['LEARNING_STANDARDS','USER_ID','USER_ROLE','CACHE_TIMESTAMP','USER_EMAIL','SELECTED_STANDARDS','DIALOG_STATUS']
    .forEach(k => p.deleteProperty(k));
  return true;
}