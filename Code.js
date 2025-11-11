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
  const user_email =  currentUser();
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

