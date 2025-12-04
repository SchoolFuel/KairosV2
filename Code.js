function onOpen() {
  try {
    addKairosMenu_(DocumentApp.getUi());
  } catch (e) {
    try {
      addKairosMenu_(SpreadsheetApp.getUi());
    } catch (err) {
      // ignore; running outside container
    }
  }
}

function onInstall(e) {
  onOpen(e);
}

function addKairosMenu_(ui) {
  ui.createMenu('Kairos')
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

function currentUser() {
  return Session.getActiveUser().getEmail();
}

function validateUser() {
  var userProperties = PropertiesService.getUserProperties();
  const user_email = currentUser();
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

function openDialog(dialogType, title) {
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

// Function to open IgniteHelp dialog (for both Teacher and Student)
function openIgniteHelp() {
  openDialog('ignite-help', 'Ignite Help');
}

// Ticket functions are in Tickets.js - they should be accessible automatically
// If they're not accessible, ensure Tickets.js is saved and the project is deployed
// Functions: createTicket, getTickets, getPossibleResolutions

// My Spark Stats functions are in MySparkStats.js - they should be accessible automatically  
// If they're not accessible, ensure MySparkStats.js is saved and the project is deployed
// Functions: getMySparkStats
// Note: hideToday functionality is handled in frontend via localStorage

function clearUserCache() {
  const p = PropertiesService.getUserProperties();
  ['LEARNING_STANDARDS', 'USER_ID', 'USER_ROLE', 'CACHE_TIMESTAMP', 'USER_EMAIL', 'SELECTED_STANDARDS', 'DIALOG_STATUS']
    .forEach(k => p.deleteProperty(k));
  return true;
}
