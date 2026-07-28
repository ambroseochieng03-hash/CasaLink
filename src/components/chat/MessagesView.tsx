import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { 
  MessageSquare, 
  Send, 
  Image as ImageIcon, 
  Check, 
  CheckCheck, 
  User as UserIcon,
  X,
  Phone,
  Building,
  Sparkles
} from 'lucide-react';

export const MessagesView: React.FC = () => {
  const { user } = useAuth();
  const { activeConversationId, setActiveConversationId, showToast, openAuthModal } = usePlatform();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (activeConversationId) {
      const conv = conversations.find(c => c.id === activeConversationId);
      if (conv) {
        selectConversation(conv);
      }
    }
  }, [activeConversationId, conversations]);

  const fetchConversations = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.getConversations(user.id);
      setConversations(res);
      if (res.length > 0 && !activeConversationId) {
        selectConversation(res[0]);
      }
    } catch (e: any) {
      // quiet
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setActiveConversationId(conv.id);
    try {
      const msgs = await api.getMessages(conv.id);
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);

      // Fetch AI Quick Reply Suggestions
      if (user) {
        fetchChatSuggestions(conv.id, user.id);
      }
    } catch (e: any) {
      // quiet
    }
  };

  const fetchChatSuggestions = async (convId: string, userId: string) => {
    setIsFetchingSuggestions(true);
    try {
      const res = await api.getChatSuggestions(convId, userId);
      setChatSuggestions(res.suggestions || []);
    } catch (e: any) {
      // quiet fallback
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    if (!user || !activeConv) return;
    const textToSend = customText !== undefined ? customText : inputText.trim();
    if (!textToSend && !imageUrlInput.trim()) return;

    const receiverId = user.id === activeConv.tenantId ? activeConv.landlordId : activeConv.tenantId;

    try {
      const res = await api.sendMessage({
        conversationId: activeConv.id,
        senderId: user.id,
        receiverId,
        houseId: activeConv.houseId,
        text: textToSend,
        imageUrl: imageUrlInput.trim() || undefined,
      });

      setMessages(prev => [...prev, res.message]);
      setInputText('');
      setImageUrlInput('');
      setShowImageInput(false);
      setTimeout(scrollToBottom, 100);

      // Re-fetch updated AI suggestions
      fetchChatSuggestions(activeConv.id, user.id);
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8 space-y-4 max-w-md mx-auto my-8">
        <MessageSquare className="w-12 h-12 text-[#146C5A] mx-auto opacity-40" />
        <h2 className="text-lg font-extrabold text-[#242424]">Sign In to Chat</h2>
        <p className="text-xs text-gray-500">Communicate directly with verified landlords and tenants.</p>
        <button onClick={() => openAuthModal('login')} className="px-6 py-3 bg-[#146C5A] text-white font-bold text-xs rounded-xl shadow-md">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden h-[75vh] flex flex-col md:flex-row">
      
      {/* Left Conversations Sidebar */}
      <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 bg-[#F8F9FA]">
          <h2 className="text-sm font-extrabold text-[#242424] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#146C5A]" /> Chat Conversations
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              No conversations yet. Tap "Message Landlord" on any house details page to initiate chat.
            </div>
          ) : (
            conversations.map(conv => {
              const otherName = user.id === conv.tenantId ? conv.landlordName : conv.tenantName;
              const isSelected = activeConv?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                    isSelected ? 'bg-[#146C5A]/10 border-l-4 border-[#146C5A]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#146C5A] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {otherName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-[#242424] truncate">{otherName}</h4>
                      <span className="text-[10px] text-gray-400">{conv.lastMessageTime.split('T')[1]?.substring(0, 5)}</span>
                    </div>
                    {conv.houseTitle && (
                      <p className="text-[11px] text-[#B66A32] font-semibold truncate">{conv.houseTitle}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Chat Window */}
      <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden md:flex justify-center items-center text-gray-400 p-8' : 'flex'}`}>
        {!activeConv ? (
          <div className="text-center space-y-2">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-500">Select a conversation to open chat window</p>
          </div>
        ) : (
          <>
            {/* Active Chat Header */}
            <div className="p-4 border-b border-gray-100 bg-[#F8F9FA] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveConv(null)} className="md:hidden text-xs text-[#146C5A] font-bold">
                  ← Back
                </button>
                <div>
                  <h3 className="text-xs font-extrabold text-[#242424]">
                    {user.id === activeConv.tenantId ? activeConv.landlordName : activeConv.tenantName}
                  </h3>
                  {activeConv.houseTitle && (
                    <span className="text-[11px] text-[#B66A32] font-semibold block">{activeConv.houseTitle}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8F9FA]/50">
              {messages.map(msg => {
                const isMe = msg.senderId === user.id;

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3.5 shadow-xs text-xs space-y-1 ${
                      isMe
                        ? 'bg-[#146C5A] text-white rounded-br-xs'
                        : 'bg-white text-[#242424] border border-gray-200 rounded-bl-xs'
                    }`}>
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="" className="rounded-xl max-h-48 object-cover mb-2 border" />
                      )}
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className={`text-[10px] block text-right font-medium opacity-70 ${isMe ? 'text-[#E8D8B9]' : 'text-gray-400'}`}>
                        {msg.createdAt.split('T')[1]?.substring(0, 5)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form onSubmit={e => handleSendMessage(e)} className="p-3 border-t border-gray-200 bg-white space-y-2 shrink-0">
              
              {/* AI Quick Reply Pills */}
              {chatSuggestions.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <span className="text-[10px] font-bold text-[#146C5A] uppercase tracking-wider flex items-center gap-1 shrink-0 bg-[#146C5A]/10 px-2 py-1 rounded-lg">
                    <Sparkles className="w-3 h-3 text-[#B66A32]" /> AI Quick Replies
                  </span>
                  {chatSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(undefined, sug)}
                      className="px-3 py-1 bg-[#F8F9FA] hover:bg-[#146C5A]/10 text-gray-700 hover:text-[#146C5A] border border-gray-200 hover:border-[#146C5A]/30 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 active:scale-95"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {showImageInput && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    placeholder="Paste Image URL (Unsplash or direct image link)..."
                    className="flex-1 px-3 py-1.5 bg-[#F8F9FA] border rounded-xl text-xs"
                  />
                  <button type="button" onClick={() => setShowImageInput(false)} className="text-xs text-gray-400">
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageInput(!showImageInput)}
                  className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Attach Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
                />

                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-[#146C5A] hover:bg-[#0E5244] text-white shadow-md transition-transform active:scale-95"
                >
                  <Send className="w-4 h-4 text-[#E8D8B9]" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>

    </div>
  );
};
