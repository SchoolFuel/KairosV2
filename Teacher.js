function getTeacherProjectDetails(projectId, userId) {
  if (!projectId) throw new Error("Missing projectId");
  if (!userId) throw new Error("Missing userId");

  const url =
    "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const payload = {
    action: "myprojects",
    payload: {
      project_id: String(projectId),
      user_id: String(userId),
      email_id: "teacher1@gmail.com",
      request: "project_details",
    },
  };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code < 200 || code >= 300) throw new Error("API " + code + ": " + text);

  let out = {};
  try {
    out = JSON.parse(text);
  } catch (e) {
    throw new Error("Bad JSON: " + text);
  }

  const body =
    out && typeof out.body === "string" ? JSON.parse(out.body) : out.body;

  let project =
    (body && body.project) ||
    (Array.isArray(body && body.projects) ? body.projects[0] : null) ||
    out.project ||
    (Array.isArray(out.projects) ? out.projects[0] : null) ||
    (body &&
      body.data &&
      (body.data.project ||
        (Array.isArray(body.data.projects) ? body.data.projects[0] : null))) ||
    null;

  if (!project) {
    (function findProject(o) {
      if (!o || typeof o !== "object" || project) return;
      const looks =
        (o.project_id || o.id) &&
        (o.project_title || o.title) &&
        Array.isArray(o.stages);
      if (looks) {
        project = o;
        return;
      }
      for (const k in o) {
        const v = o[k];
        if (Array.isArray(v)) v.forEach(findProject);
        else findProject(v);
        if (project) return;
      }
    })(body || out);
  }

  if (!project) {
    return {
      statusCode: out.statusCode || 200,
      body: { project: null, debug: body || out },
    };
  }
  if (project && !project.user_id && out.action_response?.user_id) {
    project.user_id = out.action_response.user_id;
  }

  return { statusCode: out.statusCode || 200, body: { project } };
}


function createStudentTab(studentName, projectContent) {
  Logger.log(studentName);
  
  try {
    
    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();
    
   
    if (body.getNumChildren() > 1) {
      body.appendPageBreak();
    }
    
    const headingText = `${studentName.toUpperCase()} - PROJECT`;
    
    const heading = body.appendParagraph(headingText);
    heading.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    
    try {
      const headingTextElement = heading.editAsText();
      headingTextElement.setForegroundColor('#1a365d')
                       .setBold(true)
                       .setFontSize(18);
    } catch (headingError) {
      Logger.log('Error formatting heading: ' + headingError);
      Logger.log('Heading error details: ' + headingError.toString());
      Logger.log('Heading error stack: ' + headingError.stack);
    }
    
    try {
      body.appendHorizontalRule();
    } catch (ruleError) {
      Logger.log('Error adding horizontal rule: ' + ruleError);
      Logger.log('Rule error details: ' + ruleError.toString());
    }
    
    
    if (!projectContent || projectContent.trim() === '') {
      body.appendParagraph('No project content available.');
      return true;
    }
    
    const sections = projectContent.split(/\n\s*\n/);
    
    let processedParagraphs = 0;
    let processedSections = 0;
    
    sections.forEach((section, sectionIndex) => {
      if (section.trim()) {
        processedSections++;
        
        
        const lines = section.split('\n');
        
        lines.forEach((line, lineIndex) => {
          if (line.trim()) {
            processedParagraphs++;
            
            try {
              const para = body.appendParagraph(line.trim());
              
              
              if (line.includes('**')) {
                try {
                  const text = para.getText();
                  const textElement = para.editAsText();
                  
                  let processedText = text;
                  let offset = 0;
                  
                 
                  const boldRegex = /\*\*(.*?)\*\*/g;
                  let match;
                  let boldMatches = 0;
                  
                  while ((match = boldRegex.exec(text)) !== null) {
                    boldMatches++;
                    
                    const fullMatch = match[0]; 
                    const boldText = match[1]; 
                    const startIndex = match.index - offset;
                    const endIndex = startIndex + fullMatch.length;
                   
                    textElement.deleteText(startIndex + boldText.length, endIndex - 1);
                    textElement.deleteText(startIndex, startIndex + 1);
                    
                    textElement.setBold(startIndex, startIndex + boldText.length - 1, true);
                    
                   
                    offset += 4; 
                  }
                  
                  
                  if (line.trim().startsWith('**') || (line.includes('**') && line.length < 100)) {
                    textElement.setFontSize(14)
                              .setForegroundColor('#2d3748');
                  }
                  
                } catch (boldError) {
                  Logger.log('Error processing bold formatting: ' + boldError);
                  Logger.log('Bold error details: ' + boldError.toString());
                  Logger.log('Bold error stack: ' + boldError.stack);
                }
              }
              
              
              try {
                para.setFontFamily('Arial')
                    .setFontSize(11)
                    .setSpacingAfter(8)
                    .setLineSpacing(1.15);
              } catch (formatError) {
                Logger.log('Error applying paragraph formatting: ' + formatError);
                Logger.log('Format error details: ' + formatError.toString());
              }
              
            } catch (paraError) {
              Logger.log('Error processing paragraph ' + processedParagraphs + ': ' + paraError);
              Logger.log('Paragraph error details: ' + paraError.toString());
              Logger.log('Paragraph error stack: ' + paraError.stack);
            }
          }
        });
        
       
        try {
          body.appendParagraph('');
        } catch (spacingError) {
          Logger.log('Error adding section spacing: ' + spacingError);
        }
      }
    });
    
    
    try {
      body.appendParagraph('');
      const timestamp = body.appendParagraph(`Exported: ${new Date().toLocaleString()}`);
      timestamp.setFontSize(9);
      const timestampText = timestamp.editAsText();
      timestampText.setForegroundColor('#666666')
               .setItalic(true);
    } catch (timestampError) {
      Logger.log('Error adding timestamp: ' + timestampError);
      Logger.log('Timestamp error details: ' + timestampError.toString());
    }
    
  
    try {
      body.appendParagraph('');
      body.appendParagraph('');
    } catch (finalSpacingError) {
      Logger.log('Error adding final spacing: ' + finalSpacingError);
    }
    
    return { success: true, message: `Successfully exported ${studentName}'s project` };
    
  } catch (error) {
    Logger.log('=== MAJOR ERROR IN EXPORT ===');
    Logger.log('Error creating student tab: ' + error);
    Logger.log('Error name: ' + error.name);
    Logger.log('Error message: ' + error.message);
    Logger.log('Error details: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    Logger.log('Student name: ' + studentName);
    Logger.log('Content type: ' + typeof projectContent);
    Logger.log('Content length: ' + (projectContent ? projectContent.length : 'N/A'));
    Logger.log('=== END ERROR DETAILS ===');
    
    throw new Error(`Failed to export ${studentName}: ${error.message} (${error.name})`);
  }
}

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