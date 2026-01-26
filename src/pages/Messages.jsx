import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.userId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all users first (to display names/avatars)
      const usersRes = await api.users.getAll();
      const usersMap = {};
      usersRes.data?.forEach(u => {
        usersMap[u.userId] = u;
      });
      setUsers(usersMap);

      // Load user's messages - wrap in try-catch to handle 404
      let conversationsData = {};
      try {
        const messagesRes = await api.messages.getByUser(user.userId);
        conversationsData = messagesRes.data || {};
      } catch (error) {
        // If 404, user has no messages yet - this is fine
        if (error.response?.status !== 404) {
          console.error('Error loading messages:', error);
        }
        conversationsData = {};
      }
      
      // Convert to array format with conversation info
      const convList = Object.keys(conversationsData).map(convId => {
        const msgs = conversationsData[convId];
        const lastMessage = msgs[msgs.length - 1];
        
        // Get the other user in the conversation
        const otherUserId = lastMessage.senderId === user.userId 
          ? lastMessage.receiverId 
          : lastMessage.senderId;
        
        return {
          id: convId,
          otherUserId,
          otherUser: usersMap[otherUserId],
          messages: msgs,
          lastMessage: lastMessage,
          unreadCount: msgs.filter(m => !m.isRead && m.receiverId === user.userId).length,
        };
      });

      // Sort by most recent message
      convList.sort((a, b) => new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt));
      
      setConversations(convList);
      
      // Check if there's a ?chat=userId parameter in URL
      const urlParams = new URLSearchParams(location.search);
      const chatUserId = urlParams.get('chat');
      
      if (chatUserId) {
        // Try to find existing conversation with this user
        const existingConv = convList.find(conv => conv.otherUserId === chatUserId);
        
        if (existingConv) {
          // Select existing conversation
          selectConversation(existingConv);
        } else {
          // Create new conversation with this user
          const otherUser = usersMap[chatUserId];
          if (otherUser) {
            // Create consistent conversation ID (always put lower userId first)
            const ids = [user.userId, chatUserId].sort();
            const convId = `conv_${ids[0]}_${ids[1]}`;
            
            const newConv = {
              id: convId,
              otherUserId: chatUserId,
              otherUser: otherUser,
              messages: [],
              lastMessage: null,
              unreadCount: 0,
              isNew: true // Flag to indicate this is a new conversation
            };
            setSelectedConversation(newConv);
            setMessages([]);
          }
        }
        
        // Clean up URL parameter
        navigate('/messages', { replace: true });
      } else if (convList.length > 0) {
        // Auto-select first conversation if no URL parameter
        selectConversation(convList[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages(conversation.messages || []);
    
    // Mark messages as read
    if (conversation.messages) {
      conversation.messages.forEach(msg => {
        if (!msg.isRead && msg.receiverId === user.userId && msg.messageId) {
          // Make the API call directly with proper error handling
          fetch(`http://localhost:3001/api/messages/${msg.messageId}/read`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          }).catch(err => {
            console.error('Error marking message as read:', err);
          });
        }
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !selectedConversation) return;

    try {
      const newMsg = await api.messages.send({
        senderId: user.userId,
        receiverId: selectedConversation.otherUserId,
        conversationId: selectedConversation.id,
        content: messageText,
        attachments: [],
      });

      // Add the new message to the current messages immediately
      const updatedMessages = [...messages, newMsg.data];
      setMessages(updatedMessages);
      
      // Update the conversation in the list
      if (selectedConversation.isNew) {
        // This was a new conversation, add it to the list
        const updatedConv = {
          ...selectedConversation,
          isNew: false,
          messages: updatedMessages,
          lastMessage: newMsg.data,
          unreadCount: 0
        };
        setSelectedConversation(updatedConv);
        setConversations([updatedConv, ...conversations]);
      } else {
        // Update existing conversation
        const updatedConvs = conversations.map(conv => {
          if (conv.id === selectedConversation.id) {
            return {
              ...conv,
              messages: updatedMessages,
              lastMessage: newMsg.data
            };
          }
          return conv;
        });
        // Re-sort by most recent
        updatedConvs.sort((a, b) => new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt));
        setConversations(updatedConvs);
        
        // Update selected conversation
        setSelectedConversation({
          ...selectedConversation,
          messages: updatedMessages,
          lastMessage: newMsg.data
        });
      }
      
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading text="Loading messages..." />;
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-white">
      <div className="grid grid-cols-12 h-full">
        {/* Conversations Sidebar */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Messages</h2>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-600">No conversations yet</p>
                <p className="text-sm text-gray-500 mt-2">Start chatting with tutors!</p>
              </div>
            ) : (
              <div>
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <img
                          src={conv.otherUser?.profilePicture || `https://ui-avatars.com/api/?name=${conv.otherUser?.name || 'User'}`}
                          alt={conv.otherUser?.name}
                          className="w-12 h-12 rounded-full"
                        />
                        {conv.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conv.otherUser?.name || 'Unknown User'}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {conv.lastMessage ? formatTime(conv.lastMessage.sentAt) : ''}
                          </span>
                        </div>
                        
                        <p className={`text-sm truncate ${
                          conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                        }`}>
                          {conv.lastMessage?.senderId === user.userId && 'You: '}
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedConversation.otherUser?.profilePicture || `https://ui-avatars.com/api/?name=${selectedConversation.otherUser?.name || 'User'}`}
                      alt={selectedConversation.otherUser?.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.otherUser?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedConversation.otherUser?.course} • Year {selectedConversation.otherUser?.year}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      className="text-sm"
                      onClick={() => window.location.href = `/tutors/${selectedConversation.otherUserId}`}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👋</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedConversation.isNew ? 'Start a new conversation' : 'No messages yet'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {selectedConversation.isNew 
                        ? `Send a message to ${selectedConversation.otherUser?.name} to start chatting!`
                        : 'Start the conversation by sending a message below.'
                      }
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isOwn = msg.senderId === user.userId;
                    const showDate = index === 0 || 
                      new Date(msg.sentAt).toDateString() !== new Date(messages[index - 1].sentAt).toDateString();
                    
                    return (
                      <div key={msg.messageId}>
                        {/* Date Divider */}
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                              {new Date(msg.sentAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Message Bubble */}
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isOwn
                                  ? 'bg-indigo-600 text-white rounded-br-sm'
                                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                              }`}
                            >
                              <p className="break-words">{msg.content}</p>
                            </div>
                            <div className={`flex items-center gap-2 mt-1 px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.sentAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </span>
                              {isOwn && msg.isRead && (
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Type a message..."
                    rows="1"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                  
                  <Button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="px-6"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}