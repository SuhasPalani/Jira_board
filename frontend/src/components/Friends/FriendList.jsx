// frontend/src/components/Friends/FriendList.jsx
import React, { useState, useEffect } from 'react';
import { getFriends, getFriendRequests, acceptFriendRequest } from '../../services/api';

const FriendList = ({ onSelectFriend, compact = false }) => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        getFriends(),
        getFriendRequests()
      ]);
      setFriends(friendsData.friends);
      setRequests(requestsData.requests);
    } catch (error) {
      console.error('Failed to load friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      await loadData();
    } catch (error) {
      console.error('Failed to accept request:', error);
      alert('Failed to accept friend request');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto' }}></div>
        <p className="text-sm text-gray" style={{ marginTop: '12px' }}>Loading friends...</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div style={{ padding: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-100)' }}>
          Friends {friends.length > 0 && `(${friends.length})`}
        </h3>
        
        {friends.length === 0 ? (
          <p className="text-sm text-gray" style={{ padding: '12px 0' }}>
            No friends yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {friends.map(friend => (
              <div
                key={friend._id}
                onClick={() => onSelectFriend && onSelectFriend(friend)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  background: 'var(--bg-200)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: onSelectFriend ? 'pointer' : 'default',
                  transition: 'all 0.2s'
                }}
                className="friend-item"
              >
                <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                  {friend.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-100)' }} className="truncate">
                    {friend.username}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-200)' }} className="truncate">
                    {friend.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {requests.length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--bg-300)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-100)' }}>
              Pending Requests ({requests.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {requests.map(request => (
                <div
                  key={request._id}
                  style={{
                    padding: '10px',
                    background: 'var(--primary-100)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--primary-200)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                      {request.from.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: '500' }}>
                        {request.from.username}
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAcceptRequest(request._id)}
                    style={{ width: '100%', fontSize: '12px', padding: '6px 12px' }}
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', borderBottom: '2px solid var(--bg-300)' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <button
            onClick={() => setActiveTab('friends')}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'friends' ? '2px solid var(--primary-200)' : 'none',
              marginBottom: '-2px',
              color: activeTab === 'friends' ? 'var(--primary-200)' : 'var(--text-200)',
              fontWeight: activeTab === 'friends' ? '600' : '400',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'requests' ? '2px solid var(--primary-200)' : 'none',
              marginBottom: '-2px',
              color: activeTab === 'requests' ? 'var(--primary-200)' : 'var(--text-200)',
              fontWeight: activeTab === 'requests' ? '600' : '400',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            Requests
            {requests.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '-8px',
                background: 'var(--danger)',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'friends' ? (
        <div>
          {friends.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: 'var(--text-200)'
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ margin: '0 auto 16px', opacity: 0.3 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                No friends yet
              </p>
              <p style={{ fontSize: '14px' }}>
                Search for users to add as friends!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {friends.map(friend => (
                <div
                  key={friend._id}
                  style={{
                    padding: '16px',
                    background: 'white',
                    border: '1px solid var(--bg-300)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.2s',
                    cursor: onSelectFriend ? 'pointer' : 'default'
                  }}
                  onClick={() => onSelectFriend && onSelectFriend(friend)}
                  className="friend-card"
                >
                  <div style={{ textAlign: 'center' }}>
                    <div className="avatar" style={{ 
                      width: '60px', 
                      height: '60px', 
                      fontSize: '24px',
                      margin: '0 auto 12px'
                    }}>
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                    <p style={{ 
                      fontSize: '15px', 
                      fontWeight: '600', 
                      color: 'var(--text-100)',
                      marginBottom: '4px'
                    }}>
                      {friend.username}
                    </p>
                    <p style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-200)'
                    }} className="truncate">
                      {friend.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {requests.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: 'var(--text-200)'
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ margin: '0 auto 16px', opacity: 0.3 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                No pending requests
              </p>
              <p style={{ fontSize: '14px' }}>
                You're all caught up!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.map(request => (
                <div
                  key={request._id}
                  style={{
                    padding: '16px',
                    background: 'white',
                    border: '2px solid var(--primary-200)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '20px' }}>
                      {request.from.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-100)' }}>
                        {request.from.username}
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--text-200)' }}>
                        {request.from.email}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-200)', marginTop: '4px' }}>
                        Wants to be your friend
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAcceptRequest(request._id)}
                    >
                      Accept
                    </button>
                    <button className="btn btn-secondary">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .friend-item:hover {
          background: var(--bg-300) !important;
          transform: translateX(4px);
        }
        
        .friend-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
          border-color: var(--primary-200);
        }
      `}</style>
    </div>
  );
};

export default FriendList;