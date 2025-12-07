import { useState, useEffect } from 'react';
import { X, Plus, Search, Filter, AlertCircle } from 'lucide-react';
import './IgniteHelp.css';
import igniteIcon from '../../assets/Ignite Help Icon.png';

export default function IgniteHelp() {
  const [view, setView] = useState('create'); // 'list', 'create', 'detail'
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');

  // New ticket form state (aligned with sidebar spec)
  const [newTicket, setNewTicket] = useState({
    topic: 'Submission Problem',
    priority: 'Normal',
    description: '',
    notifyMe: true
  });

  // Instant Help state
  const [showInstantHelp, setShowInstantHelp] = useState(false);
  const [instantSuggestions, setInstantSuggestions] = useState([]);
  const [loadingInstantHelp, setLoadingInstantHelp] = useState(false);
  const [instantHelpMessage, setInstantHelpMessage] = useState('');

  // Sample tickets for demo
  const sampleTickets = [
    {
      id: 1,
      title: 'Unable to Submit Project',
      category: 'Technical',
      priority: 'High',
      status: 'Pending',
      created: '2025-10-29',
      creator: 'student1@gmail.com',
      description: 'Getting error when trying to submit my science project. The submit button is not responding.'
    },
    {
      id: 2,
      title: 'Need Help with Learning Standards',
      category: 'Academic',
      priority: 'Medium',
      status: 'In Progress',
      created: '2025-10-28',
      creator: 'teacher1@gmail.com',
      description: 'How do I align my project with multiple learning standards?'
    },
    {
      id: 3,
      title: 'Login Issues',
      category: 'Technical',
      priority: 'High',
      status: 'Resolved',
      created: '2025-10-27',
      creator: 'student2@gmail.com',
      description: 'Cannot access my account. Password reset not working.',
      resolution: 'Password reset link was sent. Issue resolved.'
    },
    {
      id: 4,
      title: 'Project Feedback Request',
      category: 'Academic',
      priority: 'Low',
      status: 'Resolved',
      created: '2025-10-26',
      creator: 'student3@gmail.com',
      description: 'Looking for feedback on my robotics project before final submission.',
      resolution: 'Feedback provided via email.'
    }
  ];

  useEffect(() => {
    // Load user and tickets
    try {
      if (window.google && google.script && google.script.run) {
        google.script.run.withSuccessHandler((resp) => {
          if (resp && resp.email) setUserEmail(resp.email);
          if (resp && resp.role) setUserRole(resp.role);
        }).validateUser();
        
        // Load tickets from backend
        google.script.run.withSuccessHandler((result) => {
          if (result && result.success && result.tickets) {
            setTickets(result.tickets);
          } else {
            // Fallback to sample tickets if backend fails
            setTickets(sampleTickets);
          }
          setLoading(false);
        }).withFailureHandler(() => {
          // Fallback to sample tickets on error
          setTickets(sampleTickets);
          setLoading(false);
        }).getTickets();
      } else {
        // Not in Apps Script environment, use sample data
        setTickets(sampleTickets);
        setLoading(false);
      }
    } catch (e) {
      // Fallback to sample tickets on error
      setTickets(sampleTickets);
      setLoading(false);
    }
  }, []);

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Similar resolved tickets feature removed per latest spec

  const handleCreateTicket = () => {
    if (!newTicket.topic || !newTicket.description) {
      alert('Please fill in all required fields');
      return;
    }

    const ticketData = {
      topic: newTicket.topic,
      priority: newTicket.priority,
      description: newTicket.description,
      notifyMe: newTicket.notifyMe
    };

    try {
      if (window.google && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler((result) => {
            if (result && result.success) {
              // Show success message from API if available
              const successMessage = result.message || 'Ticket created successfully!';
              
              // If the response includes possible solutions, show them
              if (result.data && result.data.possible_solutions && result.data.possible_solutions.length > 0) {
                // Show instant help with the solutions from the response
                setInstantSuggestions(result.data.possible_solutions.map(sol => ({
                  title: sol.title,
                  url: sol.url,
                  tags: sol.tags,
                  tagArray: sol.tags ? sol.tags.split(',').map(t => t.trim()) : []
                })));
                setShowInstantHelp(true);
                setInstantHelpMessage(result.data.message || successMessage);
                // Stay in 'create' view so user can see the solutions
                // Don't switch to 'list' view - let user see the instant help panel
              } else {
                // No solutions returned - switch to list view and show alert
                setView('list');
                alert(successMessage);
              }
              
              // Refresh tickets list
              google.script.run.withSuccessHandler((ticketResult) => {
                if (ticketResult && ticketResult.success && ticketResult.tickets) {
                  setTickets(ticketResult.tickets);
                }
              }).getTickets();
              
              // Reset form (but only if we're switching views)
              if (!result.data || !result.data.possible_solutions || result.data.possible_solutions.length === 0) {
                setNewTicket({ topic: 'Submission Problem', priority: 'Normal', description: '', notifyMe: true });
              }
            } else {
              alert('Failed to create ticket: ' + (result.message || 'Unknown error'));
            }
          })
          .withFailureHandler((error) => {
            alert('Error creating ticket: ' + error);
          })
          .createTicket(ticketData);
      } else {
        // Fallback: add locally if not in Apps Script
    const ticket = {
      id: tickets.length + 1,
          title: newTicket.topic,
          category: 'Technical',
          priority: newTicket.priority,
          description: newTicket.description,
      status: 'Pending',
      created: new Date().toISOString().split('T')[0],
      creator: userEmail
    };
    setTickets([ticket, ...tickets]);
        setNewTicket({ topic: 'Submission Problem', priority: 'Normal', description: '', notifyMe: true });
    setView('list');
      }
    } catch (error) {
      alert('Error creating ticket: ' + error);
    }
  };

  const generateInstantSuggestions = (topic, description) => {
    const base = {
      'Login Issue': [
        { title: 'Password Reset Loop On Chrome', status: 'Resolved', ref: 'KB-1123', details: 'Clearing cookies and forcing refresh resolved cached auth.' },
        { title: 'Check Credentials', status: 'Tip', ref: '', details: 'Verify email/password; check Caps Lock.' },
        { title: 'Try Incognito', status: 'Tip', ref: '', details: 'Open an incognito window or another browser.' }
      ],
      'Submission Problem': [
        { title: 'Complete Required Fields', status: 'Resolved', ref: 'KB-210', details: 'Fill all required fields before submission.' },
        { title: 'Validate File Size/Type', status: 'Tip', ref: '', details: 'Ensure uploads meet size/type rules.' },
        { title: 'Hard Refresh', status: 'Resolved', ref: 'KB-098', details: 'Reload the page and resubmit after validation.' }
      ],
      'Learning Standards': [
        { title: 'Use Standards Selector', status: 'Tip', ref: '', details: 'Filter by grade and subject to narrow standards.' },
        { title: 'Map Tasks To 1–2 Standards', status: 'Tip', ref: '', details: 'Keep alignment focused for clarity.' },
        { title: 'Reference Sample Projects', status: 'Tip', ref: '', details: 'Review exemplars for alignment patterns.' }
      ],
      'Account Access': [
        { title: 'Verify Google Account', status: 'Tip', ref: '', details: 'Confirm you are signed in with the right account.' },
        { title: 'Permissions Check', status: 'Open', ref: 'FR-78', details: 'Ask admin/teacher to verify access.' },
        { title: 'Wait And Refresh', status: 'Tip', ref: '', details: 'If newly invited, wait and refresh.' }
      ],
      'Other': [
        { title: 'Share Clear Problem Statement', status: 'Tip', ref: '', details: 'Describe issue and expected outcome.' },
        { title: 'Steps To Reproduce', status: 'Tip', ref: '', details: 'List steps so we can reproduce.' },
        { title: 'Attach Evidence', status: 'Tip', ref: '', details: 'Screenshots or error messages help triage.' }
      ]
    };

    const topicList = base[topic] || base['Other'];
    const contextHint = description && description.length > 15
      ? { title: 'Context From Your Description', status: 'Tip', ref: '', details: `"${description.slice(0, 120)}"...` }
      : null;

    return contextHint ? [...topicList, contextHint] : topicList;
  };

  const handleInstantHelp = () => {
    if (!newTicket.topic || !newTicket.description) {
      alert('Please fill in topic and description before getting instant help');
      return;
    }

    setLoadingInstantHelp(true);
    setShowInstantHelp(true);
    setInstantSuggestions([]);
    setInstantHelpMessage('');

    try {
      if (window.google && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler((result) => {
            setLoadingInstantHelp(false);
            if (result && result.success && result.solutions) {
              // Transform API response to match UI format
              const transformedSuggestions = result.solutions.map(sol => ({
                title: sol.title,
                url: sol.url,
                tags: sol.tags,
                // Parse tags string into array for display
                tagArray: sol.tags ? sol.tags.split(',').map(t => t.trim()) : []
              }));
              setInstantSuggestions(transformedSuggestions);
              setInstantHelpMessage(result.message || '');
            } else {
              // Fallback to local suggestions if API fails
              const suggestions = generateInstantSuggestions(newTicket.topic, newTicket.description);
              setInstantSuggestions(suggestions);
              setInstantHelpMessage(result.message || 'Using local suggestions');
            }
          })
          .withFailureHandler(() => {
            setLoadingInstantHelp(false);
            // Fallback to local suggestions on error
            const suggestions = generateInstantSuggestions(newTicket.topic, newTicket.description);
            setInstantSuggestions(suggestions);
            setInstantHelpMessage('Using local suggestions');
          })
          .getPossibleResolutions(newTicket.topic, newTicket.description);
      } else {
        // Not in Apps Script environment, use local suggestions
        setLoadingInstantHelp(false);
        const suggestions = generateInstantSuggestions(newTicket.topic, newTicket.description);
        setInstantSuggestions(suggestions);
        setInstantHelpMessage('');
      }
    } catch (error) {
      setLoadingInstantHelp(false);
      // Fallback to local suggestions on error
      const suggestions = generateInstantSuggestions(newTicket.topic, newTicket.description);
      setInstantSuggestions(suggestions);
      setInstantHelpMessage('');
    }
  };

  const getStatusClass = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('resolved') || statusLower.includes('closed')) return 'is-approve';
    if (statusLower.includes('progress')) return 'is-neutral';
    if (statusLower.includes('pending')) return 'is-pending';
    return 'is-reject';
  };

  const getPriorityClass = (priority) => {
    if (priority === 'High') return 'priority-high';
    if (priority === 'Medium') return 'priority-medium';
    return 'priority-low';
  };

  // CREATE TICKET VIEW
  if (view === 'create') {

    return (
      <div className="ignite-container">
        <div className="ignite-header">
          <div className="ignite-email">{userEmail}</div>
        </div>

        <div className="ignite-hero">
          <h1 className="ignite-title">Ignite Help</h1>
          <div className="ignite-subtitle">Get Fast Help</div>
          <div className="ignite-logo">
            <img src={igniteIcon} alt="Ignite Help" className="brain-bulb-icon" />
          </div>
        </div>

        <div className="ignite-content">
          <div className="section-header">
            <h2 className="section-title">Create New Ticket</h2>
            <button onClick={() => setView('list')} className="btn-secondary">
              View My Tickets
            </button>
          </div>

          <div className="create-ticket-form">

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Topic *</label>
                <select
                  value={newTicket.topic}
                  onChange={(e) => setNewTicket({ ...newTicket, topic: e.target.value })}
                  className="form-select"
                >
                  <option value="Submission Problem">Submission Problem</option>
                  <option value="Login Issue">Login Issue</option>
                  <option value="Learning Standards">Learning Standards</option>
                  <option value="Account Access">Account Access</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Priority *</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="form-select"
                >
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notify Me</label>
                <div className="checkbox-row">
                  <input
                    id="notifyMe"
                    type="checkbox"
                    checked={newTicket.notifyMe}
                    onChange={(e) => setNewTicket({ ...newTicket, notifyMe: e.target.checked })}
                  />
                  <label htmlFor="notifyMe" className="muted">Notify Me</label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Provide detailed information about your issue..."
                className="form-textarea"
                rows="6"
              />
            </div>

            <div className="form-actions-row">
              <button
                type="button"
                onClick={handleInstantHelp}
                className="btn-instant"
              >
                Get Instant Help
              </button>

            <button
              onClick={handleCreateTicket}
                disabled={!newTicket.topic || !newTicket.description}
              className="btn-primary btn-create"
            >
              <Plus size={18} />
              Create Ticket
            </button>
            </div>
          </div>

          {showInstantHelp && (
            <div className="instant-help-panel">
              <div className="instant-help-header">
                <h3>Possible Resolutions</h3>
                <button className="btn-secondary" onClick={() => setShowInstantHelp(false)}>Close</button>
              </div>
              {instantHelpMessage && (
                <div className="instant-help-message" style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '14px', color: '#1e40af' }}>
                  {instantHelpMessage}
                </div>
              )}
              {loadingInstantHelp ? (
                <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Loading possible resolutions...</div>
                </div>
              ) : instantSuggestions.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>No resolutions found</div>
                </div>
              ) : (
                <div className="instant-cards">
                  {instantSuggestions.map((s, idx) => (
                    <div key={idx} className="instant-card">
                      <div className="instant-card-top">
                        <div className="instant-card-title">
                          {s.url ? (
                            <a 
                              href={s.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: 'inherit', textDecoration: 'none' }}
                              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                            >
                              {s.title}
                            </a>
                          ) : (
                            s.title
                          )}
                        </div>
                        <div className="chip-row">
                          {s.tagArray && s.tagArray.length > 0 && s.tagArray.map((tag, tagIdx) => (
                            <span key={tagIdx} className="chip chip-tag">{tag}</span>
                          ))}
                          {s.status && <span className={`chip ${s.status === 'Resolved' ? 'chip-resolved' : s.status === 'Open' ? 'chip-open' : 'chip-tip'}`}>{s.status}</span>}
                          {s.ref && <span className="chip chip-ref">{s.ref}</span>}
                </div>
              </div>
                      {s.url && (
                        <div className="instant-card-details" style={{ marginTop: '8px' }}>
                          <a 
                            href={s.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '13px' }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            View Solution →
                          </a>
                  </div>
                      )}
                      {s.details && (
                        <div className="instant-card-details">{s.details}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Similar Resolved Tickets section removed per request */}
        </div>
      </div>
    );
  }

  // TICKET DETAIL VIEW
  if (view === 'detail' && selectedTicket) {
    return (
      <div className="ignite-container">
        <div className="ignite-header">
          <div className="ignite-email">{userEmail}</div>
        </div>

        <div className="ignite-hero">
          <h1 className="ignite-title">Get Sparked!</h1>
          <div className="ignite-logo">
            <img src={igniteIcon} alt="Ignite Help" className="brain-bulb-icon" style={{ width: '100px', height: '100px' }} />
          </div>
        </div>

        <div className="ignite-content">
          <div className="section-header">
            <h2 className="section-title">Ticket Details</h2>
            <button onClick={() => setView('list')} className="btn-secondary">
              ← Back to Tickets
            </button>
          </div>

          <div className="ticket-detail">
            <div className="ticket-detail-header">
              <h2>{selectedTicket.title}</h2>
              <div className="ticket-badges">
                <span className={`status-pill ${getStatusClass(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
                <span className={`priority-badge ${getPriorityClass(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
              </div>
            </div>

            <div className="ticket-meta">
              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="category-badge">{selectedTicket.category}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Created:</span>
                <span>{selectedTicket.created}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Created by:</span>
                <span>{selectedTicket.creator}</span>
              </div>
            </div>

            <div className="ticket-section">
              <h3>Description</h3>
              <p>{selectedTicket.description}</p>
            </div>

            {selectedTicket.resolution && (
              <div className="ticket-section resolution-section">
                <h3>Resolution</h3>
                <p>{selectedTicket.resolution}</p>
              </div>
            )}

            {selectedTicket.status !== 'Resolved' && (
              <div className="ticket-actions">
                <button className="btn-primary">Update Ticket</button>
                <button className="btn-secondary">Add Comment</button>
                <button className="btn-success">Mark as Resolved</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MAIN TICKET LIST VIEW (Default)
  return (
    <div className="ignite-container">
      {/* Header - Exact match to screenshot */}
      <div className="ignite-header">
        <div className="ignite-email">{userEmail}</div>
      </div>

      {/* Hero Section */}
      <div className="ignite-hero">
        <h1 className="ignite-title">Ignite Help</h1>
        <div className="ignite-subtitle">Get Fast Help</div>
        <div className="ignite-logo">
          <img src={igniteIcon} alt="Ignite Help" className="brain-bulb-icon" />
        </div>
      </div>

      {/* Content Section */}
      <div className="ignite-content">
        <div className="section-header">
          <h2 className="section-title">Support Tickets</h2>
          <button onClick={() => setView('create')} className="btn-primary">
            <Plus size={18} />
            New Ticket
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <Filter size={18} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Tickets List - Matching screenshot card style */}
        {loading ? (
          <div className="loading-state">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="empty-state">
            <p>No tickets found</p>
          </div>
        ) : (
          <div className="tickets-list">
            {filteredTickets.map(ticket => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-card-main">
                  <div className="ticket-info">
                    <div className="ticket-title">{ticket.title}</div>
                    <div className="ticket-meta-row">
                      <span className="category-badge">{ticket.category}</span>
                      <span className="separator">•</span>
                      <span className={`priority-badge ${getPriorityClass(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className="separator">•</span>
                      <span className="ticket-date">{ticket.created}</span>
                    </div>
                  </div>
                  <span className={`status-pill ${getStatusClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>

                <button
                  className="review-btn"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setView('detail');
                  }}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
