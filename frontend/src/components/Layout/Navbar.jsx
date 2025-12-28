// Placeholder for Navbar component
// frontend/src/components/Layout/Navbar.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/authContext';
import { useBoard } from '../../contexts/BoardContext';
import { useNavigate } from 'react-router-dom';
import FriendSearch from '../Friends/FriendSearch';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { boards, currentBoard, loadBoard, createBoard } = useBoard();
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      await createBoard(newBoardName, '');
      setNewBoardName('');
      setShowNewBoard(false);
    } catch (error) {
      console.error('Failed to create board:', error);
      alert('Failed to create board');
    }
  };

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid var(--bg-300)',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: '700',
          background: 'linear-gradient(135deg, var(--primary-200), var(--accent-200))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          AI Project Board
        </h1>

        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowBoardMenu(!showBoardMenu)}
          >
            {currentBoard?.name || 'Select Board'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {showBoardMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              background: 'white',
              border: '1px solid var(--bg-300)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '200px',
              zIndex: 100
            }}>
              {boards.map(board => (
                <button
                  key={board._id}
                  onClick={() => {
                    loadBoard(board._id);
                    setShowBoardMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: currentBoard?._id === board._id ? 'var(--primary-100)' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'var(--text-100)'
                  }}
                >
                  {board.name}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--bg-300)', padding: '8px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowNewBoard(true);
                    setShowBoardMenu(false);
                  }}
                  style={{ width: '100%' }}
                >
                  + New Board
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          className="btn btn-ghost"
          onClick={() => setShowFriendSearch(true)}
          title="Friends"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="avatar"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ cursor: 'pointer', width: '36px', height: '36px' }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'white',
              border: '1px solid var(--bg-300)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '180px',
              zIndex: 100
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bg-300)' }}>
                <p style={{ fontWeight: '600', fontSize: '14px' }}>{user?.username}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-200)' }}>{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--danger)'
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {showNewBoard && (
        <div className="modal-overlay" onClick={() => setShowNewBoard(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Board</h2>
              <button className="modal-close" onClick={() => setShowNewBoard(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateBoard}>
              <div className="form-group">
                <label className="form-label">Board Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="My Awesome Project"
                  autoFocus
                />
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewBoard(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFriendSearch && (
        <FriendSearch onClose={() => setShowFriendSearch(false)} />
      )}
    </nav>
  );
};

export default Navbar;

