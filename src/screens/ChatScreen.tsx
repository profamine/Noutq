import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Mic,
  Volume2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Languages,
  ChevronDown,
  Smile,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  GraduationCap,
  Clock,
  Trash2,
  Settings,
  Info,
  MicOff
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ===== Types =====
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  translation?: string;
  transliteration?: string;
  isTyping?: boolean;
  rating?: 'up' | 'down' | null;
  corrections?: string[];
  vocabulary?: VocabWord[];
  audioPlaying?: boolean;
  type?: 'text' | 'quiz' | 'tip' | 'correction';
}

interface VocabWord {
  arabic: string;
  armenian: string;
  transliteration: string;
}

interface QuickReply {
  text: string;
  arabic: string;
}

// ===== AI Response Logic =====
const SYSTEM_PROMPT = `You are "Armin", a friendly and encouraging Arabic tutor for Armenian speakers.

## Your Role
- Teach Modern Standard Arabic (MSA) to Armenian-speaking beginners (A1 level).
- Always respond in BOTH Arabic and Armenian (Հայերեն).
- Keep a warm, patient, and motivating tone — celebrate small wins.

## Response Format (ALWAYS follow this structure)
1. **Arabic text** — written clearly with full harakat (تشكيل) when possible.
2. **Armenian translation** — accurate and natural.
3. **Transliteration** — in Latin letters for pronunciation help.
4. **Vocabulary** — at the end, list 2-4 new words in this format:
   [VOCAB]
   word_arabic | word_armenian | transliteration
   [/VOCAB]

## Teaching Rules
- If the user makes an Arabic error, gently correct it. Show the wrong form ❌ then the correct form ✓.
- Use simple sentences. Avoid complex grammar explanations.
- Occasionally ask the user a question to keep them engaged.
- Use emojis sparingly to make responses friendly (✅ ❌ 📚 🌟).
- If the user writes in Armenian, respond fully in Armenian + Arabic.
- If the user writes in Arabic (even incorrectly), praise the attempt first.

## Context
The user is learning Arabic through a gamified app. They have completed structured lessons.
This chat is for free practice and questions.`;

const sendMessageToAI = async (
  userText: string,
  history: Message[]
): Promise<Omit<Message, 'id' | 'timestamp'>> => {
  const contents = [
    ...history.filter(m => !m.isTyping).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: userText }] },
  ];

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, systemInstruction: SYSTEM_PROMPT }),
  });

  if (!res.ok) {
    let errorMsg = `Server error ${res.status}`;
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg += `: ${errorData.error}`;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  const data = await res.json();
  let text = data.text || '...';

  let vocabulary: VocabWord[] | undefined;
  const vocabMatch = text.match(/\[VOCAB\]([\s\S]*?)\[\/VOCAB\]/);
  if (vocabMatch) {
    const vocabLines = vocabMatch[1].trim().split('\n');
    vocabulary = vocabLines.map((line: string) => {
      const parts = line.split('|').map(p => p.trim());
      return {
        arabic: parts[0] || '',
        armenian: parts[1] || '',
        transliteration: parts[2] || '',
      };
    }).filter((v: VocabWord) => v.arabic && v.armenian);
    
    // Remove the vocab block from the text
    text = text.replace(/\[VOCAB\][\s\S]*?\[\/VOCAB\]/, '').trim();
  }

  return {
    sender: 'ai',
    text,
    type: 'text',
    vocabulary,
  };
};

// ===== Typing Indicator Component =====
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm">
          <div className="flex gap-1.5 items-center">
            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Vocabulary Card Component =====
function VocabularyCard({ words }: { words: VocabWord[] }) {
  const [flipped, setFlipped] = useState<number | null>(null);
  const { t } = useLanguage();

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
        <BookOpen size={12} />
        {t('chat.new_words')}
      </p>
      <div className="flex flex-wrap gap-2">
        {words.map((word, idx) => (
          <button
            key={idx}
            onClick={() => setFlipped(flipped === idx ? null : idx)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 transform ${
              flipped === idx
                ? 'bg-emerald-500 text-white scale-105 shadow-md'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {flipped === idx ? (
              <span className="block text-center">
                <span className="block text-sm">{word.armenian}</span>
                <span className="block text-[10px] opacity-80 mt-0.5">{word.transliteration}</span>
              </span>
            ) : (
              <span className="text-sm">{word.arabic}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== Message Bubble Component =====
function MessageBubble({
  message,
  onRate,
  onCopy,
  onSpeak,
}: {
  key?: React.Key;
  message: Message;
  onRate: (id: number, rating: 'up' | 'down') => void;
  onCopy: (text: string) => void;
  onSpeak: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const { t } = useLanguage();
  const isUser = message.sender === 'user';

  const handleCopy = () => {
    onCopy(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = () => {
    switch (message.type) {
      case 'quiz':
        return <GraduationCap size={14} className="text-purple-500" />;
      case 'tip':
        return <Lightbulb size={14} className="text-amber-500" />;
      case 'correction':
        return <Languages size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeBadge = () => {
    switch (message.type) {
      case 'quiz':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 mb-2">
            <GraduationCap size={10} /> QUIZ
          </span>
        );
      case 'tip':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 mb-2">
            <Lightbulb size={10} /> TIP
          </span>
        );
      case 'correction':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 mb-2">
            <Languages size={10} /> CORRECTION
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0 mb-1">
            <Bot size={16} className="text-white" />
          </div>
        )}
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0 mb-1">
            <User size={16} className="text-white" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          {/* Message Bubble */}
          <div
            className={`relative px-4 py-3 rounded-2xl transition-all duration-200 ${
              isUser
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm shadow-md shadow-blue-200'
                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
            }`}
          >
            {!isUser && getTypeBadge()}
            <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>

            {/* Translation toggle */}
            {!isUser && message.translation && (
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                <Languages size={12} />
                {showTranslation ? t('chat.hide_translation') : t('chat.show_translation')}
              </button>
            )}

            {showTranslation && message.translation && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 italic">{message.translation}</p>
                {message.transliteration && (
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">{message.transliteration}</p>
                )}
              </div>
            )}

            {/* Vocabulary */}
            {!isUser && message.vocabulary && message.vocabulary.length > 0 && (
              <VocabularyCard words={message.vocabulary} />
            )}
          </div>

          {/* Timestamp & Actions */}
          <div className={`flex items-center gap-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-gray-400">
              {message.timestamp.toLocaleTimeString('hy-AM', { hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* Action buttons for AI messages */}
            {!isUser && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Copy"
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-gray-400" />}
                </button>
                <button
                  onClick={() => onSpeak(message.text)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Listen"
                >
                  <Volume2 size={12} className="text-gray-400" />
                </button>
                <button
                  onClick={() => onRate(message.id, 'up')}
                  className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${message.rating === 'up' ? 'text-green-500' : 'text-gray-400'}`}
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  onClick={() => onRate(message.id, 'down')}
                  className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${message.rating === 'down' ? 'text-red-500' : 'text-gray-400'}`}
                >
                  <ThumbsDown size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Main Chat Screen =====
export default function ChatScreen() {
  const { t } = useLanguage();
  
  // ===== Quick Replies =====
  const quickReplies: QuickReply[] = [
    { text: t('chat.quick_hello'), arabic: 'مرحبا' },
    { text: t('chat.quick_thanks'), arabic: 'شكراً لك' },
    { text: t('chat.quick_test'), arabic: 'اختبار' },
    { text: t('chat.quick_help'), arabic: 'مساعدة' },
    { text: t('chat.quick_new_words'), arabic: 'كلمات جديدة' },
    { text: t('chat.quick_correction'), arabic: 'تصحيح' },
  ];
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '🌟 مرحباً بك في درس اللغة العربية!\n\nأنا معلمك الذكي. يمكنني:\n\n📚 تعليمك كلمات جديدة\n✍️ تصحيح أخطائك\n📝 إعطائك اختبارات\n💬 التحدث معك\n\nمن أين تريد أن نبدأ؟',
      sender: 'ai',
      timestamp: new Date(),
      translation: 'Բարի գալուստ արաբերենի դաս:\n\nԵս քո խելացի ուսուցիչն եմ:',
      transliteration: 'Marhaban bik fi dars al-lugha al-arabiyya!',
      type: 'text',
      vocabulary: [
        { arabic: 'مرحباً', armenian: 'Բարև', transliteration: 'Marhaban' },
        { arabic: 'معلم', armenian: 'Ուսուցիչ', transliteration: "Mu'allim" },
        { arabic: 'اللغة العربية', armenian: 'Արաբերեն', transliteration: 'Al-lugha al-arabiyya' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const handleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    setIsRecording(true);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { audioBitsPerSecond: 16000 });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const result = reader.result as string;
          if (!result || !result.includes(',')) return;
          const base64Data = result.split(',')[1];

          setIsTranscribing(true);
          try {
             const res = await fetch('/api/transcribe', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ audioData: base64Data, mimeType: mediaRecorder.mimeType, expectedLanguage: 'Arabic or Armenian' })
             });
             const data = await res.json();
             if (data.text) {
                 setInput(prev => (prev ? prev + ' ' : '') + data.text);
             }
          } catch(err) {
             console.error(err);
          } finally {
             setIsTranscribing(false);
          }
        };
      };

      mediaRecorder.start();
      
      // Limit recording to 15 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
      }, 15000);
    } catch (err) {
      console.error('Mic error:', err);
      setIsRecording(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    const trimmed = messageText.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Date.now(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setShowQuickReplies(false);
    setIsTyping(true);

    const currentMessages = [...messagesRef.current, userMsg];

    try {
      const aiMsg = await sendMessageToAI(trimmed, currentMessages);
      setMessages((prev) => [
        ...prev,
        { ...aiMsg, id: Date.now() + 2, timestamp: new Date() },
      ]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Կներեք, խնդիր առաջացավ: Խնդրում ենք փորձել կրկին:';
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: 'ai',
          timestamp: new Date(),
          text: `⚠️ Սխալ: ${errorMsg}`,
          type: 'text',
        },
      ]);
    } finally {
      setIsTyping(false);
      setShowQuickReplies(true);
    }
  };

  const handleRate = (id: number, rating: 'up' | 'down') => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, rating } : msg)));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Try to use native Arabic voice if possible
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
      
      if (arabicVoice || voices.length === 0) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.8;
        if (arabicVoice) utterance.voice = arabicVoice;
        utterance.onerror = () => {
          // Fallback to server TTS if native fails
          new Audio(`/api/tts?text=${encodeURIComponent(text)}`).play().catch(() => {});
        };
        window.speechSynthesis.speak(utterance);
        return;
      }
    }
    
    // Fallback if no native voice or no Speech Synthesis
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
    audio.play().catch(() => {});
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        text: '🔄 تم مسح المحادثة. هيا نبدأ من جديد!\n\nԶրույցը ջնջված է: Եկեք նորից սկսենք:',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
      },
    ]);
    setShowMenu(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 relative overflow-hidden pb-24">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-200/50 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors lg:hidden">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-md">
              <Bot size={22} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              {t('chat.title')}
              <Sparkles size={14} className="text-amber-500" />
            </h1>
            <p className="text-[11px] text-green-500 font-medium">{t('chat.status')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Phone size={18} className="text-gray-500" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Video size={18} className="text-gray-500" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreVertical size={18} className="text-gray-500" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={handleClearChat}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Trash2 size={16} className="text-gray-400" />
                    {t('chat.clear')}
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                    <Settings size={16} className="text-gray-400" />
                    {t('chat.settings')}
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                    <Info size={16} className="text-gray-400" />
                    {t('chat.help')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Date Separator */}
      <div className="flex justify-center py-3">
        <span className="bg-white/80 backdrop-blur-sm text-[11px] text-gray-500 px-3 py-1 rounded-full border border-gray-200/50 shadow-sm flex items-center gap-1.5">
          <Clock size={11} />
          {new Date().toLocaleDateString('hy-AM', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 space-y-4 pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onRate={handleRate}
            onCopy={handleCopy}
            onSpeak={handleSpeak}
          />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-36 right-4 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all z-20 animate-bounce"
        >
          <ChevronDown size={20} className="text-gray-600" />
        </button>
      )}

      {/* Quick Replies */}
      {showQuickReplies && !isTyping && (
        <div className="px-4 pb-2 overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(reply.arabic)}
                className="flex-shrink-0 px-3.5 py-2 bg-white border border-emerald-200 rounded-full text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 shadow-sm hover:shadow active:scale-95"
              >
                <span className="block text-sm">{reply.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-200/50 px-3 py-3 z-20">
        <div className="flex items-end gap-2">
          <button className="p-2.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 mb-0.5">
            <Smile size={22} className="text-gray-400" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              disabled={isTyping}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t('chat.input_placeholder')}
              className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none border border-transparent focus:border-emerald-200 placeholder-gray-400"
              dir="auto"
            />
          </div>
          {input.trim() ? (
            <button
              onClick={() => handleSend()}
              disabled={isTyping}
              className={`w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center transition-all shadow-md flex-shrink-0 ${isTyping ? 'opacity-50 cursor-not-allowed' : 'hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200 active:scale-95'}`}
            >
              <Send size={18} className="ml-0.5" />
            </button>
          ) : (
            <button 
              onClick={handleRecord}
              disabled={isTyping || isTranscribing} 
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md flex-shrink-0 ${isTyping || isTranscribing ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' : isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white' : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-200 active:scale-95'}`}>
              {isTranscribing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}