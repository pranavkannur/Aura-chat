import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LogOut, Send, User as UserIcon, Search, X, ChevronLeft } from 'lucide-react';

const ChatPage = () => {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser]);

  const fetchUsers = useCallback(async (query = '') => {
    try {
      const endpoint = query 
        ? `/api/auth/search?query=${query}`
        : '/api/auth/users';
      
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
        const { data } = await axios.get(`/api/messages/${selectedUser._id}`, {
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
        const isFromSelected = selectedUser && data.senderId === selectedUser._id;
        const isToSelected = selectedUser && data.receiverId === selectedUser._id;
        
        if (isFromSelected || (isToSelected && data.senderId === user._id)) {
          setMessages((prev) => {
            if (prev.find(m => m._id === data._id)) return prev;
            return [...prev, data];
          });
        }
      };
      
      socket.on('newMessage', handleNewMessage);
      return () => socket.off('newMessage', handleNewMessage);
    }
  }, [socket, selectedUser, user._id]);

  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || isSending) return;

    setIsSending(true);
    const messageContent = newMessage;
    setNewMessage(''); 

    try {
      const { data } = await axios.post('/api/messages', {
        receiverId: selectedUser._id,
        content: messageContent
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      console.error('Failed to send message', err);
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[100dvh] bg-aura-dark overflow-hidden relative">
      {/* Sidebar - Hidden on mobile if a user is selected */}
      <div className={`w-full md:w-80 border-r border-aura-forest/20 flex flex-col transition-all duration-300 ${
        selectedUser ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-aura-forest/20 flex justify-between items-center">
          <h1 className="text-xl font-bold text-aura-light">Aura Chat</h1>
          <button onClick={logout} className="text-aura-light/50 hover:text-red-400 transition-colors">
            <LogOut size={20} />
          </button>
        </div>

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
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-aura-deep rounded-full flex items-center justify-center text-aura-light">
                    <UserIcon size={24} />
                  </div>
                  {onlineUsers.includes(u._id) && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-aura-dark rounded-full"></div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-aura-light font-medium truncate">{u.username}</p>
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

      {/* Main Chat Area - Hidden on mobile if no user is selected */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${
        selectedUser ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedUser ? (
          <>
            <div className="p-3 md:p-4 border-b border-aura-forest/20 flex items-center gap-2 md:gap-3">
              {/* Back button for mobile */}
              <button 
                onClick={() => setSelectedUser(null)}
                className="md:hidden p-1 text-aura-light/60 hover:text-aura-light"
              >
                <ChevronLeft size={28} />
              </button>
              
              <div className="w-10 h-10 bg-aura-deep rounded-full flex items-center justify-center text-aura-light font-bold flex-shrink-0">
                {selectedUser.username[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-aura-light font-bold truncate">{selectedUser.username}</h2>
                <p className="text-xs text-aura-light/40">{onlineUsers.includes(selectedUser._id) ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.senderId === user._id ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl ${
                      msg.senderId === user._id
                        ? 'bg-aura-forest text-aura-dark rounded-tr-none'
                        : 'bg-aura-deep/30 text-aura-light rounded-tl-none border border-aura-forest/20'
                    }`}
                  >
                    <p className="text-sm md:text-base break-words">{msg.content}</p>
                    <p className="text-[10px] mt-1 opacity-50 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-aura-forest/20 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-aura-deep/10 border border-aura-forest/30 rounded-xl px-4 py-2 text-aura-light focus:outline-none focus:border-aura-forest transition-colors text-sm md:text-base"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={isSending}
                className={`bg-aura-forest text-aura-dark p-2 rounded-xl transition-all active:scale-95 flex-shrink-0 ${isSending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-aura-forest/80'}`}
              >
                <Send size={24} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-aura-light/20 p-8 text-center">
            <h2 className="text-2xl font-bold">Select a user to start chatting</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
