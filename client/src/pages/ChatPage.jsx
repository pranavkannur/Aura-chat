import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LogOut, Send, User as UserIcon, Search, X } from 'lucide-react';

const ChatPage = () => {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchUsers = useCallback(async (query = '') => {
    try {
      const endpoint = query 
        ? `http://localhost:5001/api/auth/search?query=${query}`
        : 'http://localhost:5001/api/auth/users';
      
      const { data } = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  }, [user.token]);

  useEffect(() => {
    if (!searchQuery) {
      fetchUsers();
    }
  }, [fetchUsers, searchQuery]);

  useEffect(() => {
    if (!searchQuery) return;
    
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, fetchUsers]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;
      try {
        const { data } = await axios.get(`http://localhost:5001/api/messages/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };
    fetchMessages();
  }, [selectedUser, user.token]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        if (selectedUser && data.senderId === selectedUser._id) {
          setMessages((prev) => [...prev, data]);
        }
      };
      
      socket.on('newMessage', handleNewMessage);
      return () => socket.off('newMessage', handleNewMessage);
    }
  }, [socket, selectedUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const { data } = await axios.post('http://localhost:5001/api/messages', {
        receiverId: selectedUser._id,
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setMessages((prev) => [...prev, data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="flex h-screen bg-aura-dark overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-aura-forest/20 flex flex-col">
        <div className="p-4 border-b border-aura-forest/20 flex justify-between items-center">
          <h1 className="text-xl font-bold text-aura-light">Aura Chat</h1>
          <button onClick={logout} className="text-aura-light/50 hover:text-red-400 transition-colors">
            <LogOut size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-aura-forest/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-aura-light/30" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-aura-deep/20 border border-aura-forest/20 rounded-lg pl-10 pr-10 py-2 text-sm text-aura-light focus:outline-none focus:border-aura-forest/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-light/30 hover:text-aura-light transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {users.length > 0 ? (
            users.map((u) => (
              <div
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                  selectedUser?._id === u._id ? 'bg-aura-forest/20' : 'hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-aura-deep rounded-full flex items-center justify-center text-aura-light">
                    <UserIcon size={20} />
                  </div>
                  {onlineUsers.includes(u._id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-aura-dark rounded-full"></div>
                  )}
                </div>
                <div>
                  <p className="text-aura-light font-medium">{u.username}</p>
                  <p className="text-xs text-aura-light/40">{onlineUsers.includes(u._id) ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-aura-light/30 text-sm">
                {searchQuery ? 'No users found' : 'No users available'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-aura-forest/20 flex items-center gap-3">
              <div className="w-10 h-10 bg-aura-deep rounded-full flex items-center justify-center text-aura-light font-bold">
                {selectedUser.username[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-aura-light font-bold">{selectedUser.username}</h2>
                <p className="text-xs text-aura-light/40">{onlineUsers.includes(selectedUser._id) ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.senderId === user._id ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      msg.senderId === user._id
                        ? 'bg-aura-forest text-aura-dark rounded-tr-none'
                        : 'bg-aura-deep/30 text-aura-light rounded-tl-none border border-aura-forest/20'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-[10px] mt-1 opacity-50 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-aura-forest/20 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-aura-deep/10 border border-aura-forest/30 rounded-xl px-4 py-2 text-aura-light focus:outline-none focus:border-aura-forest transition-colors"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                className="bg-aura-forest text-aura-dark p-2 rounded-xl hover:bg-aura-forest/80 transition-all active:scale-95"
              >
                <Send size={24} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-aura-light/20">
            <h2 className="text-2xl font-bold">Select a user to start chatting</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
