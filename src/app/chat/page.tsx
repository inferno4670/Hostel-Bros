'use client';

import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  arrayUnion,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chat, Message, User } from '@/types';
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Users as UsersIcon, 
  User as UserIcon,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Search,
  X
} from 'lucide-react';
import { getRelativeTime, generateId, getInitials } from '@/lib/utils';

export default function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newChatForm, setNewChatForm] = useState({
    type: 'private' as 'private' | 'group',
    name: '',
    selectedUsers: [] as string[]
  });

  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    };

    const chatsQuery = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Chat[];
      
      const userChats = chatsData.filter(chat => chat.participants.includes(user.id));
      setChats(userChats);
      setLoading(false);
    });

    fetchUsers();
    return () => unsubscribeChats();
  }, [user]);

  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'chats', selectedChat, 'messages'),
      orderBy('sentAt', 'asc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate() || new Date()
      })) as Message[];
      
      setMessages(messagesData);
    });

    return () => unsubscribeMessages();
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || newChatForm.selectedUsers.length === 0) return;

    const participants = [user.id, ...newChatForm.selectedUsers];

    if (newChatForm.type === 'private' && newChatForm.selectedUsers.length === 1) {
      const existingChat = chats.find(chat => 
        chat.type === 'private' && 
        chat.participants.length === 2 &&
        chat.participants.includes(newChatForm.selectedUsers[0])
      );
      
      if (existingChat) {
        setSelectedChat(existingChat.id);
        setShowNewChat(false);
        return;
      }
    }

    try {
      const chatData = {
        type: newChatForm.type,
        name: newChatForm.type === 'group' ? newChatForm.name : undefined,
        participants,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      setNewChatForm({ type: 'private' as 'private' | 'group', name: '', selectedUsers: [] });
      setShowNewChat(false);
      setSelectedChat(chatRef.id);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'chat-files');

    try {
      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      return data.fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChat || (!messageInput.trim() && !selectedFile)) return;

    try {
      let fileUrl = '';
      let fileName = '';
      let messageType: Message['type'] = 'text';

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        fileName = selectedFile.name;
        messageType = selectedFile.type.startsWith('image/') ? 'image' : 'doc';
      }

      const messageData: Omit<Message, 'id'> = {
        chatId: selectedChat,
        content: messageInput.trim(),
        type: messageType,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        sentBy: user.id,
        sentAt: new Date(),
        readBy: [user.id]
      };

      await addDoc(collection(db, 'chats', selectedChat, 'messages'), messageData);

      await updateDoc(doc(db, 'chats', selectedChat), {
        lastMessage: {
          content: messageInput.trim() || (fileName ? `📎 ${fileName}` : 'File'),
          sentBy: user.id,
          sentAt: new Date(),
          type: messageType
        },
        updatedAt: new Date()
      });

      setMessageInput('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') return chat.name || 'Group Chat';
    const otherParticipant = chat.participants.find(id => id !== user?.id);
    const otherUser = users.find(u => u.id === otherParticipant);
    return otherUser?.name || 'Unknown User';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') {
      return (
        <div className="bg-purple-500 rounded-full p-2">
          <UsersIcon className="h-6 w-6 text-white" />
        </div>
      );
    }
    
    const otherParticipant = chat.participants.find(id => id !== user?.id);
    const otherUser = users.find(u => u.id === otherParticipant);
    
    return (
      <div className="bg-blue-500 rounded-full p-2">
        <span className="text-white font-semibold text-sm">
          {getInitials(otherUser?.name || 'U')}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const selectedChatData = chats.find(c => c.id === selectedChat);

  return (
    <Layout>
      <div className="flex h-full bg-white rounded-lg shadow overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <button
                onClick={() => setShowNewChat(true)}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedChat === chat.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {getChatAvatar(chat)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-gray-900">
                          {getChatName(chat)}
                        </h3>
                        {chat.lastMessage && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {chat.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat && selectedChatData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {getChatAvatar(selectedChatData)}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getChatName(selectedChatData)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedChatData.participants.length} participants
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const sender = users.find(u => u.id === message.sentBy);
                  const isOwnMessage = message.sentBy === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-xs lg:max-w-md">
                        {!isOwnMessage && (
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {sender?.name || 'Unknown'}
                          </div>
                        )}
                        
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.type === 'text' && (
                            <p>{message.content}</p>
                          )}
                          
                          {message.type === 'image' && message.fileUrl && (
                            <div>
                              {message.content && <p className="mb-2">{message.content}</p>}
                              <img
                                src={message.fileUrl}
                                alt={message.fileName}
                                className="max-w-full h-auto rounded"
                              />
                            </div>
                          )}
                          
                          {message.type === 'doc' && message.fileUrl && (
                            <div>
                              {message.content && <p className="mb-2">{message.content}</p>}
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <a
                                  href={message.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm underline"
                                >
                                  {message.fileName}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                          {getRelativeTime(message.sentAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                {selectedFile && (
                  <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {selectedFile.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 text-gray-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-600" />
                      )}
                      <span className="text-sm text-gray-700">{selectedFile.name}</span>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <Paperclip className="h-5 w-5" />
                  </label>
                  
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <button
                    type="submit"
                    disabled={!messageInput.trim() && !selectedFile}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* New Chat Modal */}
        {showNewChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">New Chat</h3>
                  <button onClick={() => setShowNewChat(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleCreateChat} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chat Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewChatForm({ ...newChatForm, type: 'private' })}
                      className={`p-3 border rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                        newChatForm.type === 'private'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>Private</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChatForm({ ...newChatForm, type: 'group' })}
                      className={`p-3 border rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                        newChatForm.type === 'group'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <UsersIcon className="h-4 w-4" />
                      <span>Group</span>
                    </button>
                  </div>
                </div>
                
                {newChatForm.type === 'group' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                    <input
                      type="text"
                      value={newChatForm.name}
                      onChange={(e) => setNewChatForm({ ...newChatForm, name: e.target.value })}
                      placeholder="Enter group name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={newChatForm.type === 'group'}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Participants</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {users.filter(u => u.id !== user?.id).map(u => (
                      <label key={u.id} className="flex items-center">
                        <input
                          type={newChatForm.type === 'private' ? 'radio' : 'checkbox'}
                          name={newChatForm.type === 'private' ? 'participant' : undefined}
                          checked={newChatForm.selectedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (newChatForm.type === 'private') {
                              setNewChatForm({
                                ...newChatForm,
                                selectedUsers: e.target.checked ? [u.id] : []
                              });
                            } else {
                              if (e.target.checked) {
                                setNewChatForm({
                                  ...newChatForm,
                                  selectedUsers: [...newChatForm.selectedUsers, u.id]
                                });
                              } else {
                                setNewChatForm({
                                  ...newChatForm,
                                  selectedUsers: newChatForm.selectedUsers.filter(id => id !== u.id)
                                });
                              }
                            }
                          }}
                          className="mr-3"
                        />
                        <span className="text-sm text-gray-700">{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewChat(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={newChatForm.selectedUsers.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Create Chat
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}