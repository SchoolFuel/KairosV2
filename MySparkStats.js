// ==================== MY SPARK STATS FUNCTIONS ====================

/**
 * Get user progress stats for My Spark
 * Returns: projects completed/total, tasks completed/total
 * Note: hideToday is handled in frontend via localStorage
 */
function getMySparkStats() {
  try {
    const userEmail = currentUser();
    const userProps = PropertiesService.getUserProperties();
    const userId = userProps.getProperty('USER_ID');
    
    if (!userId) {
      // Return default stats if user not found
      return {
        success: true,
        stats: {
          projectsCompleted: 0,
          totalProjects: 0,
          tasksCompleted: 0,
          totalTasks: 0
        }
      };
    }

    // hideToday is now handled in frontend via localStorage

    const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';

    // Get projects for the user
    const projectsPayload = {
      action: "myprojects",
      payload: {
        user_id: userId,
        email_id: userEmail,
        request: "student_view_all"
      }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(projectsPayload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200 && result.status === "success") {
      const projects = result.action_response?.projects || [];
      const body = result.body || {};
      const projectsArray = Array.isArray(body.projects) ? body.projects : 
                           Array.isArray(body) ? body : 
                           projects;

      // Calculate stats
      const totalProjects = projectsArray.length;
      
      // Count completed projects (projects that are marked as completed)
      const projectsCompleted = projectsArray.filter(p => 
        p.status === 'completed' || p.status === 'Completed' || p.completed || p.is_completed
      ).length;

      // Count total tasks and completed tasks across all projects
      let totalTasks = 0;
      let totalTasksCompleted = 0;
      projectsArray.forEach(project => {
        if (project.stages && Array.isArray(project.stages)) {
          project.stages.forEach(stage => {
            if (stage.tasks && Array.isArray(stage.tasks)) {
              totalTasks += stage.tasks.length;
              const completedTasks = stage.tasks.filter(t => 
                t.status === 'completed' || t.status === 'Completed' || t.completed
              );
              totalTasksCompleted += completedTasks.length;
            }
          });
        }
      });

      return {
        success: true,
        stats: {
          projectsCompleted: projectsCompleted,
          totalProjects: totalProjects,
          tasksCompleted: totalTasksCompleted,
          totalTasks: totalTasks
        }
      };
    } else {
      // Return default stats on error
      return {
        success: true,
        stats: {
          projectsCompleted: 0,
          totalProjects: 0,
          tasksCompleted: 0,
          totalTasks: 0
        }
      };
    }
  } catch (error) {
    Logger.log('Error fetching My Spark stats: ' + error.toString());
    // Return default stats on error - must match success case structure
    return {
      success: true,
      stats: {
        projectsCompleted: 0,
        totalProjects: 0,
        tasksCompleted: 0,
        totalTasks: 0
      }
    };
  }
}

// Note: hideToday functionality is now handled in frontend via localStorage
// No backend functions needed for this feature

