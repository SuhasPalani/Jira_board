// Placeholder for Sidebar component
// frontend/src/components/Layout/Sidebar.jsx
import React, { useState } from 'react';
import { useBoard } from '../../contexts/BoardContext';
import FriendList from '../Friends/FriendList';
import './Sidebar.css';

const Sidebar = () => {
  const { boards, currentBoard, loadBoard, createBoard } = useBoard();
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState('boards');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setLoading(true);
    try {
      await createBoard(newBoardName, newBoardDescription);
      setNewBoardName('');
      setNewBoardDescription('');
      setShowNewBoard(false);
    } catch (error) {
      console.error('Failed to create board:', error);
      alert('Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            style={{ 
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s'
            }}
          >
            <polyline points="15 18 9 12 15 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {isExpanded && (
          <div className="sidebar-content">
            {/* Navigation Tabs */}
            <div className="sidebar-tabs">
              <button
                className={`sidebar-tab ${activeSection === 'boards' ? 'active' : ''}`}
                onClick={() => setActiveSection('boards')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="14" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="14" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="3" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Boards</span>
              </button>
              <button
                className={`sidebar-tab ${activeSection === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveSection('friends')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Friends</span>
              </button>
            </div>

            {/* Content Sections */}
            {activeSection === 'boards' ? (
              <div className="sidebar-section">
                <div className="sidebar-section-header">
                  <h3>Your Boards</h3>
                  <button
                    className="btn-icon"
                    onClick={() => setShowNewBoard(true)}
                    title="Create new board"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                <div className="boards-list">
                  {boards.length === 0 ? (
                    <div className="empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ opacity: 0.3, margin: '0 auto 12px' }}>
                        <rect x="3" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="14" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="14" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="3" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p>No boards yet</p>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowNewBoard(true)}
                        style={{ marginTop: '12px' }}
                      >
                        Create First Board
                      </button>
                    </div>
                  ) : (
                    boards.map(board => (
                      <button
                        key={board._id}
                        className={`board-item ${currentBoard?._id === board._id ? 'active' : ''}`}
                        onClick={() => loadBoard(board._id)}
                      >
                        <div className="board-item-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="3" y="3" width="7" height="7" rx="1"/>
                            <rect x="14" y="3" width="7" height="7" rx="1"/>
                            <rect x="14" y="14" width="7" height="7" rx="1"/>
                            <rect x="3" y="14" width="7" height="7" rx="1"/>
                          </svg>
                        </div>
                        <div className="board-item-content">
                          <span className="board-item-name">{board.name}</span>
                          {board.description && (
                            <span className="board-item-description">{board.description}</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="sidebar-section">
                <FriendList compact={true} />
              </div>
            )}

            {/* Quick Stats */}
            {currentBoard && activeSection === 'boards' && (
              <div className="sidebar-stats">
                <h4>Board Stats</h4>
                <div className="stat-item">
                  <span className="stat-label">Columns</span>
                  <span className="stat-value">{currentBoard.columns?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Members</span>
                  <span className="stat-value">{currentBoard.members?.length || 0}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* New Board Modal */}
      {showNewBoard && (
        <div className="modal-overlay" onClick={() => setShowNewBoard(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Board</h2>
              <button className="modal-close" onClick={() => setShowNewBoard(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateBoard}>
              <div className="form-group">
                <label className="form-label">Board Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="e.g., Product Launch, Marketing Campaign"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="Brief description of what this board is for..."
                  rows={3}
                />
              </div>

              <div className="form-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-200)">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>Your board will be created with default columns: Backlog, To Do, In Progress, Review, and Done.</p>
              </div>

              <div className="flex gap-2 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewBoard(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !newBoardName.trim()}
                >
                  {loading ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;