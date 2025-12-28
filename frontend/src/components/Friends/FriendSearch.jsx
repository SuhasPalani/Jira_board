// Placeholder for FriendSearch component
// frontend/src/components/Friends/FriendSearch.jsx
import React, { useState, useEffect } from 'react';
import { searchUsers, sendFriendRequest, getFriends } from '../../services/api';

const FriendSearch = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadFriends = async () => {
    try {
      const data = await getFriends();
      setFriends(data.friends);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await searchUsers(searchQuery);
      setSearchResults(data.users);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      alert('Friend request sent!');
      setSearchResults(searchResults.filter(u => u._id !== userId));
    } catch (error) {
      console.error('Failed to send friend request:', error);
      alert(error.response?.data?.error || 'Failed to send friend request');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Friends</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--bg-300)' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setActiveTab('search')}
              style={{
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'search' ? '2px solid var(--primary-200)' : 'none',
                color: activeTab === 'search' ? 'var(--primary-200)' : 'var(--text-200)',
                fontWeight: activeTab === 'search' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              style={{
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'friends' ? '2px solid var(--primary-200)' : 'none',
                color: activeTab === 'friends' ? 'var(--primary-200)' : 'var(--text-200)',
                fontWeight: activeTab === 'friends' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              Friends ({friends.length})
            </button>
          </div>
        </div>

        {activeTab === 'search' ? (
          <div>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by username or email..."
              />
            </div>

            {loading && <p className="text-sm text-gray">Searching...</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map(user => (
                <div
                  key={user._id}
                  style={{
                    padding: '12px',
                    background: 'var(--bg-200)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
                    <div>
                      <p style={{ fontWeight: '500', fontSize: '14px' }}>{user.username}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-200)' }}>{user.email}</p>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSendRequest(user._id)}
                  >
                    Add Friend
                  </button>
                </div>
              ))}

              {searchQuery.length >= 2 && !loading && searchResults.length === 0 && (
                <p className="text-sm text-gray" style={{ textAlign: 'center', padding: '20px' }}>
                  No users found
                </p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {friends.map(friend => (
              <div
                key={friend._id}
                style={{
                  padding: '12px',
                  background: 'var(--bg-200)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div className="avatar">{friend.username.charAt(0).toUpperCase()}</div>
                <div>
                  <p style={{ fontWeight: '500', fontSize: '14px' }}>{friend.username}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-200)' }}>{friend.email}</p>
                </div>
              </div>
            ))}

            {friends.length === 0 && (
              <p className="text-sm text-gray" style={{ textAlign: 'center', padding: '20px' }}>
                No friends yet. Search for users to add as friends!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendSearch;