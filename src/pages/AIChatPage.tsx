import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import {
  AlertCircle,
  Bot,
  Loader2,
  MessageCircle,
  FolderKanban,
  History,
  Settings2,
  Send,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import {
  deleteAIConversation,
  getAIConversation,
  listAIConversations,
  sendAIMessage,
  type AIConversationSummary,
} from '@/api/ai';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  {
    title: 'Explore BankApp',
    prompt: 'What can you tell me about BankApp?',
  },
  {
    title: 'Understand microservices',
    prompt: 'Explain a microservices architecture in simple terms.',
  },
  {
    title: 'Parler français',
    prompt: 'Bonjour ! Explique-moi BankApp en français.',
  },
  {
    title: 'التحدث بالعربية',
    prompt: 'مرحبا، ما هو دور BankApp؟',
  },
];

function createMessage(
  role: ChatMessage['role'],
  content: string,
): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<AIConversationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [activeTab, setActiveTab] = useState<
    'chat' | 'you' | 'projects' | 'history' | 'settings'
  >('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, error]);

  useEffect(() => {
    if (activeTab !== 'history') return;

    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError('');

      try {
        const result = await listAIConversations();
        if (!cancelled) setConversations(result);
      } catch (cause) {
        if (!cancelled) {
          setHistoryError(
            cause instanceof Error
              ? cause.message
              : 'Impossible de charger l’historique.',
          );
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  async function openConversation(id: number) {
    if (loading || historyLoading) return;

    setHistoryLoading(true);
    setHistoryError('');

    try {
      const conversation = await getAIConversation(id);
      setConversationId(conversation.id);
      setMessages(
        conversation.messages.map((message) => ({
          id: String(message.id),
          role: message.role.toLowerCase() === 'user' ? 'user' : 'assistant',
          content: message.content,
        })),
      );
      setError('');
      setInput('');
      setActiveTab('chat');
    } catch (cause) {
      setHistoryError(
        cause instanceof Error
          ? cause.message
          : 'Impossible d’ouvrir cette conversation.',
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  async function removeConversation(conversation: AIConversationSummary) {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${conversation.title || 'Conversation'} » ?`,
    );

    if (!confirmed) return;

    setHistoryError('');

    try {
      await deleteAIConversation(conversation.id);
      setConversations((current) =>
        current.filter((item) => item.id !== conversation.id),
      );

      if (conversationId === conversation.id) {
        setConversationId(null);
        setMessages([]);
        setError('');
      }
    } catch (cause) {
      setHistoryError(
        cause instanceof Error
          ? cause.message
          : 'Impossible de supprimer cette conversation.',
      );
    }
  }

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();

    if (!message || loading) return;

    setError('');
    setInput('');
    setMessages((current) => [
      ...current,
      createMessage('user', message),
    ]);
    setLoading(true);

    try {
      const response = await sendAIMessage(message, conversationId ?? undefined);
      setConversationId(response.conversationId);
      setMessages((current) => [
        ...current,
        createMessage('assistant', response.reply),
      ]);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to contact BankApp AI. Please try again.',
      );
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  function clearConversation() {
    if (loading) return;
    setConversationId(null);
    setMessages([]);
    setError('');
    setInput('');
    textareaRef.current?.focus();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-mint-200 bg-mint-50 px-3 py-1 text-xs font-semibold text-mint-800">
            <Sparkles className="h-3.5 w-3.5" />
            BANKAPP INTELLIGENCE
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
            AI Assistant
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-navy-500">
            Ask questions about BankApp and its microservices. Chat naturally
            in English, French or Arabic.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 self-start sm:flex-row sm:items-center sm:self-auto">
          <div className="flex items-center gap-2 rounded-lg border border-navy-100 bg-white px-3 py-2 text-xs font-medium text-navy-600 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint-500" />
            </span>
            Connected through API Gateway
          </div>
        </div>
      </div>

      <nav
        aria-label="AI assistant sections"
        className="flex flex-wrap gap-1 rounded-xl border border-navy-100 bg-white p-2 shadow-sm"
      >
        {[
          { id: 'chat', label: 'Chat', icon: MessageCircle },
          { id: 'you', label: 'Vous', icon: UserRound },
          { id: 'projects', label: 'Projets', icon: FolderKanban },
          { id: 'history', label: 'Historique', icon: History },
          { id: 'settings', label: 'Paramètres', icon: Settings2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              aria-current={selected ? 'page' : undefined}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                selected
                  ? 'bg-navy-950 text-mint-400'
                  : 'text-navy-600 hover:bg-navy-50 hover:text-navy-950'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === 'chat' && (
<div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="card min-w-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-navy-100 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-navy-950 text-mint-400">
                <Bot className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-navy-950">BankApp AI</h2>
                <p className="mt-0.5 text-xs text-navy-400">
                  Multilingual assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearConversation}
              disabled={loading || messages.length === 0}
              className="btn-ghost flex-shrink-0 gap-2 text-xs"
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear chat</span>
            </button>
          </div>

          <div
            className="h-[min(58vh,580px)] min-h-[360px] space-y-5 overflow-y-auto px-4 py-5 scrollbar-thin sm:px-6"
            role="log"
            aria-label="AI conversation"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center py-6 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-50 text-mint-700 ring-1 ring-mint-100">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">
                  How can I help you today?
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-navy-500">
                  Ask a question to start a conversation. Your messages are
                  sent securely through the authenticated BankApp API.
                </p>

                <div className="mt-7 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.title}
                      type="button"
                      onClick={() => void sendMessage(suggestion.prompt)}
                      disabled={loading}
                      className="group rounded-xl border border-navy-100 bg-white p-3.5 text-left transition-colors hover:border-mint-300 hover:bg-mint-50/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="block text-sm font-semibold text-navy-800 group-hover:text-navy-950">
                        {suggestion.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-navy-500">
                        {suggestion.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const userMessage = message.role === 'user';

                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      userMessage ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!userMessage && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-navy-950 text-mint-400">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[80%] ${
                        userMessage
                          ? 'rounded-tr-md bg-navy-950 text-white'
                          : 'rounded-tl-md border border-navy-100 bg-navy-50 text-navy-800'
                      }`}
                      dir={isArabic(message.content) ? 'rtl' : 'auto'}
                    >
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                        {userMessage ? 'You' : 'BankApp AI'}
                      </p>
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>

                    {userMessage && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-mint-100 text-mint-800">
                        <UserRound className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-navy-950 text-mint-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-md border border-navy-100 bg-navy-50 px-4 py-3 text-sm text-navy-500">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking…
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Message not sent</p>
                  <p className="mt-1 break-words">{error}</p>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-navy-100 bg-white p-4 sm:p-5">
            <label htmlFor="ai-message" className="sr-only">
              Message BankApp AI
            </label>
            <div className="flex items-end gap-2 rounded-xl border border-navy-200 bg-navy-50/70 p-2 transition-colors focus-within:border-mint-400 focus-within:ring-2 focus-within:ring-mint-400/20">
              <textarea
                id="ai-message"
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                maxLength={4000}
                placeholder="Ask a question in any supported language…"
                disabled={loading}
                className="max-h-36 min-h-[48px] flex-1 resize-y border-0 bg-transparent px-2 py-2 text-sm leading-6 text-navy-900 outline-none placeholder:text-navy-400 focus:ring-0 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-mint-500 text-navy-950 transition-colors hover:bg-mint-400 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
                title="Send message"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-navy-400">
              <span>Enter to send · Shift + Enter for a new line</span>
              <span>{input.length}/4000</span>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-mint-50 text-mint-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-navy-950">What I can help with</h2>
            <ul className="mt-3 space-y-3 text-sm leading-5 text-navy-500">
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mint-500" />
                Explain microservices and BankApp's known architecture.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mint-500" />
                Answer general questions in multiple languages.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mint-500" />
                Clarify concepts and guide you through the platform.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-mint-200 bg-mint-50 p-5">
            <h2 className="text-sm font-semibold text-navy-950">
              Privacy and accuracy
            </h2>
            <p className="mt-2 text-xs leading-5 text-navy-600">
              The assistant cannot inspect your real bank account or perform
              transactions. Do not include passwords, access tokens, account
              numbers or other sensitive information in your messages.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-mint-800">
              <span className="h-2 w-2 rounded-full bg-mint-500" />
              Keycloak-authenticated API
            </div>
          </div>
        </aside>
      </div>
      )}

      {activeTab === 'you' && (
        <section className="card p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-50 text-mint-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-950">Vous et vos finances</h2>
              <p className="mt-1 text-sm text-navy-500">
                Choisissez une question et continuez dans le chat.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: 'Mes comptes', prompt: 'What are my account balances?' },
              { title: 'Mes virements', prompt: 'Show my recent transfers.' },
              { title: 'Mes paiements', prompt: 'Summarize my recent payments.' },
              { title: 'Paiements échoués', prompt: 'Which of my payments failed recently?' },
              { title: 'Comparer deux mois', prompt: 'Compare mes paiements de septembre et octobre 2026.' },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => {
                  setActiveTab('chat');
                  void sendMessage(item.prompt);
                }}
                disabled={loading}
                className="rounded-xl border border-navy-100 p-4 text-left transition-colors hover:border-mint-300 hover:bg-mint-50/50 disabled:opacity-50"
              >
                <span className="block text-sm font-semibold text-navy-900">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-navy-500">{item.prompt}</span>
              </button>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-navy-500">
            Les données personnelles ne seront disponibles que si le backend
            répond à la requête et que votre session est autorisée.
          </p>
        </section>
      )}

      {activeTab === 'projects' && (
        <section className="card p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-50 text-mint-700">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-950">Projets et technologie</h2>
              <p className="mt-1 text-sm text-navy-500">
                Explorez BankApp et les concepts de développement.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: 'Architecture', prompt: "Explain BankApp's microservices architecture." },
              { title: 'Spring Boot', prompt: 'Explain the role of Spring Boot in a microservice.' },
              { title: 'Sécurité', prompt: 'Explain how Keycloak and JWT can secure BankApp.' },
              { title: 'Communication', prompt: 'Explain how API Gateway and service discovery work together.' },
              { title: 'Service IA', prompt: 'Explain how an AI chat service can communicate with other BankApp services.' },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => {
                  setActiveTab('chat');
                  void sendMessage(item.prompt);
                }}
                disabled={loading}
                className="rounded-xl border border-navy-100 p-4 text-left transition-colors hover:border-mint-300 hover:bg-mint-50/50 disabled:opacity-50"
              >
                <span className="block text-sm font-semibold text-navy-900">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-navy-500">{item.prompt}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'history' && (
        <section className="card p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-50 text-mint-700">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy-950">Historique des conversations</h2>
                <p className="mt-1 text-sm text-navy-500">
                  Conversations enregistrées sur le serveur et associées à votre compte.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                clearConversation();
                setActiveTab('chat');
              }}
              disabled={loading}
              className="btn-ghost text-sm"
            >
              Nouvelle discussion
            </button>
          </div>

          {historyError && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {historyError}
            </div>
          )}

          {historyLoading ? (
            <div className="flex items-center gap-2 rounded-xl bg-navy-50 p-5 text-sm text-navy-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de l’historique…
            </div>
          ) : conversations.length === 0 ? (
            <p className="rounded-xl bg-navy-50 p-5 text-sm text-navy-500">
              Aucune conversation enregistrée. Envoyez un message dans l’onglet Chat pour commencer.
            </p>
          ) : (
            <ol className="space-y-3">
              {conversations.map((conversation) => (
                <li
                  key={conversation.id}
                  className="flex flex-col gap-3 rounded-xl border border-navy-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => void openConversation(conversation.id)}
                    className="min-w-0 flex-1 text-left hover:text-navy-950"
                    disabled={historyLoading || loading}
                  >
                    <span className="block break-words text-sm font-semibold text-navy-900">
                      {conversation.title || 'Nouvelle conversation'}
                    </span>
                    <span className="mt-1 block text-xs text-navy-500">
                      {conversation.messageCount} message(s)
                      {' · '}
                      {conversation.updatedAt
                        ? new Date(conversation.updatedAt).toLocaleString()
                        : 'Date inconnue'}
                    </span>
                  </button>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void openConversation(conversation.id)}
                      disabled={historyLoading || loading}
                      className="rounded-lg border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50 disabled:opacity-50"
                    >
                      Ouvrir
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeConversation(conversation)}
                      disabled={historyLoading}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Supprimer ${conversation.title || 'cette conversation'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <p className="mt-4 text-xs leading-5 text-navy-500">
            L’historique est chargé depuis le backend. Vous pouvez rouvrir une conversation ou supprimer explicitement celle que vous ne souhaitez plus conserver.
          </p>
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="card p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-50 text-mint-700">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-950">Paramètres de l’assistant</h2>
              <p className="mt-1 text-sm text-navy-500">
                Informations et gestion de la conversation.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-navy-100 p-4">
              <h3 className="text-sm font-semibold text-navy-900">Langue de réponse</h3>
              <p className="mt-1 text-sm leading-5 text-navy-500">
                L’assistant peut répondre en français, en anglais ou en arabe.
                La langue est déterminée par le message ; aucun choix de langue
                persistant n’est configuré dans cette interface.
              </p>
            </div>
            <div className="rounded-xl border border-navy-100 p-4">
              <h3 className="text-sm font-semibold text-navy-900">Conversation</h3>
              <p className="mt-1 text-sm leading-5 text-navy-500">
                Commencez une nouvelle discussion. Les conversations précédentes restent dans l’historique jusqu’à leur suppression explicite.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('chat');
                  clearConversation();
                }}
                disabled={loading || messages.length === 0}
                className="btn-ghost mt-3 gap-2 text-sm text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Nouvelle discussion
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
