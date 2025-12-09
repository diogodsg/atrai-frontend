import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Search,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  X,
  Download,
  Loader2,
  ExternalLink,
  Home,
  Briefcase,
  Upload,
} from "lucide-react";
import type { Message, ProfileFeedback, JobData } from "../types";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import {
  sendMessage,
  exportToCsv,
  exportAllCandidatesToClickUp,
} from "../services/api";

interface ChatProps {
  currentJob?: JobData | null;
  initialSearchQuery?: string;
  clickUpUrl?: string;
  onNewJob?: () => void;
  onBackToHome?: () => void;
}

export function Chat({
  currentJob,
  initialSearchQuery,
  clickUpUrl,
  onNewJob,
  onBackToHome,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<ProfileFeedback[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<ProfileFeedback[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allFeedback = [...profileFeedback, ...pendingFeedback];
  // Só marca como "já avaliado" os perfis de buscas anteriores (aplicados)
  // pendingFeedback pode ser editado, então não entra aqui
  const evaluatedProfileIds = new Set(profileFeedback.map((f) => f.profileId));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Ref para evitar execução dupla no Strict Mode
  const autoSearchExecutedRef = useRef(false);

  // Auto-search when coming from job creation
  useEffect(() => {
    if (
      initialSearchQuery &&
      !autoSearchExecutedRef.current &&
      messages.length === 0
    ) {
      autoSearchExecutedRef.current = true;
      handleSend(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepara histórico para a API
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Combina feedback já aplicado com pendente
      const allFeedbackToSend = [...profileFeedback, ...pendingFeedback];
      const response = await sendMessage(
        content,
        conversationHistory,
        allFeedbackToSend
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.assistantMessage,
        timestamp: new Date(),
        profiles: response.data,
        totalProfiles: response.totalRows,
        searchCriteria: response.searchCriteria,
        query: response.query,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      // Após buscar com feedback, move pending para aplicado
      if (pendingFeedback.length > 0) {
        setProfileFeedback((prev) => [...prev, ...pendingFeedback]);
        setPendingFeedback([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao processar mensagem"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileFeedback = (feedback: ProfileFeedback) => {
    setPendingFeedback((prev) => {
      // Se foi removido, filtra fora
      if (feedback.removed) {
        return prev.filter((f) => f.profileId !== feedback.profileId);
      }

      const existing = prev.findIndex(
        (f) => f.profileId === feedback.profileId
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = feedback;
        return updated;
      }
      return [...prev, feedback];
    });
  };

  const handleRefineSearch = () => {
    const interestingCount = pendingFeedback.filter(
      (f) => f.interesting
    ).length;
    const notInterestingCount = pendingFeedback.filter(
      (f) => !f.interesting
    ).length;

    let refinementMessage = "Refine a busca com base no meu feedback: ";

    if (interestingCount > 0) {
      const interesting = pendingFeedback.filter((f) => f.interesting);
      refinementMessage += `Gostei de ${interestingCount} perfil(s)`;
      const withReasons = interesting.filter((f) => f.reason);
      if (withReasons.length > 0) {
        refinementMessage += ` (${withReasons
          .map((f) => f.reason)
          .join("; ")})`;
      }
      refinementMessage += ". ";
    }

    if (notInterestingCount > 0) {
      const notInteresting = pendingFeedback.filter((f) => !f.interesting);
      refinementMessage += `Não gostei de ${notInterestingCount} perfil(s)`;
      const withReasons = notInteresting.filter((f) => f.reason);
      if (withReasons.length > 0) {
        refinementMessage += ` (${withReasons
          .map((f) => f.reason)
          .join("; ")})`;
      }
      refinementMessage += ". ";
    }

    refinementMessage +=
      "Busque mais perfis similares aos que gostei e diferentes dos que não gostei.";

    handleSend(refinementMessage);
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingToClickUp, setIsExportingToClickUp] = useState(false);
  const [clickUpExportSuccess, setClickUpExportSuccess] = useState<
    string | null
  >(null);

  // Extrai o listId da URL do ClickUp (ex: https://app.clickup.com/12345)
  const getClickUpListId = () => {
    if (!clickUpUrl) return null;
    const match = clickUpUrl.match(/clickup\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  const handleExportToClickUp = async () => {
    const listId = getClickUpListId();
    if (!listId || !currentJob?.title) return;

    setIsExportingToClickUp(true);
    setError(null);
    setClickUpExportSuccess(null);

    try {
      // Monta histórico da conversa e feedback para buscar TODOS os candidatos do filtro
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Combina com feedback
      const allFeedback = [...profileFeedback, ...pendingFeedback];

      const result = await exportAllCandidatesToClickUp(
        listId,
        currentJob.title,
        conversationHistory,
        allFeedback
      );

      if (result.success) {
        setClickUpExportSuccess(
          `${result.candidatesCount} candidatos exportados!` +
            (result.clickUpTaskUrl ? ` ${result.clickUpTaskUrl}` : "")
        );
        // Move pending para aplicado
        setProfileFeedback((prev) => [...prev, ...pendingFeedback]);
        setPendingFeedback([]);
      } else {
        throw new Error(result.error || "Erro ao exportar");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao exportar para ClickUp"
      );
    } finally {
      setIsExportingToClickUp(false);
    }
  };

  const handleKeepResults = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Prepara histórico para a API
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Combina feedback já aplicado com pendente
      const allFeedbackToSend = [...profileFeedback, ...pendingFeedback];

      const blob = await exportToCsv(conversationHistory, allFeedbackToSend);

      // Download do arquivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candidatos_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Move pending para aplicado
      setProfileFeedback((prev) => [...prev, ...pendingFeedback]);
      setPendingFeedback([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearPendingFeedback = () => {
    setPendingFeedback([]);
  };

  const handleNewSearch = () => {
    setMessages([]);
    setProfileFeedback([]);
    setPendingFeedback([]);
    setError(null);
  };

  const feedbackStats = {
    total: allFeedback.length,
    interesting: allFeedback.filter((f) => f.interesting).length,
    notInteresting: allFeedback.filter((f) => !f.interesting).length,
    pending: pendingFeedback.length,
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-[#2d2d2d]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="p-2 text-[#707070] hover:text-[#f5f5f5] hover:bg-[#2d2d2d] rounded-lg transition-colors"
                title="Voltar ao início"
              >
                <Home className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img
                src="/logo.png"
                alt="AtrAI"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-semibold text-[#f5f5f5]">
                {currentJob?.title ? `Vaga: ${currentJob.title}` : "AtrAI"}
              </h1>
              <p className="text-xs text-[#707070]">
                {currentJob?.area
                  ? `${currentJob.area} • ${currentJob.seniority}`
                  : "Busca de Candidatos"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* ClickUp Link */}
            {clickUpUrl && (
              <a
                href={clickUpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                ClickUp
              </a>
            )}

            {/* Feedback Stats */}
            {feedbackStats.total > 0 && (
              <div className="flex items-center gap-2 text-sm">
                {feedbackStats.interesting > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 rounded-lg">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {feedbackStats.interesting}
                  </span>
                )}
                {feedbackStats.notInteresting > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 rounded-lg">
                    <ThumbsDown className="w-3.5 h-3.5" />
                    {feedbackStats.notInteresting}
                  </span>
                )}
                {feedbackStats.pending > 0 && (
                  <span className="text-xs text-[#707070]">
                    ({feedbackStats.pending} pendente
                    {feedbackStats.pending > 1 ? "s" : ""})
                  </span>
                )}
              </div>
            )}

            {onNewJob && (
              <button
                onClick={onNewJob}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#a0a0a0] hover:text-[#f5f5f5] hover:bg-[#2d2d2d] rounded-lg transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                Nova Vaga
              </button>
            )}

            {messages.length > 0 && (
              <button
                onClick={handleNewSearch}
                className="px-4 py-2 text-sm text-[#a0a0a0] hover:text-[#f5f5f5] hover:bg-[#2d2d2d] rounded-lg transition-colors"
              >
                Nova busca
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-lg shadow-[#6366f1]/20">
                <img
                  src="/logo.png"
                  alt="AtrAI"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-semibold text-[#f5f5f5] mb-2">
                Olá! Sou seu assistente de recrutamento
              </h2>
              <p className="text-[#a0a0a0] max-w-md mb-8">
                Me conte que tipo de profissional você está buscando e vou
                ajudar a encontrar os melhores candidatos.
              </p>

              {/* Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {[
                  "Preciso de desenvolvedores Python senior em São Paulo",
                  "Busque gerentes de produto com experiência em fintechs",
                  "Encontre designers UX com formação em design",
                  "Procuro engenheiros de dados com certificação AWS",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="flex items-start gap-3 p-4 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-xl border border-[#3d3d3d] text-left transition-colors"
                  >
                    <Search className="w-5 h-5 text-[#6366f1] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#a0a0a0]">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onProfileFeedback={handleProfileFeedback}
                  evaluatedProfiles={evaluatedProfileIds}
                  pendingFeedback={pendingFeedback}
                />
              ))}

              {/* Loading */}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2 text-[#a0a0a0]">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-[#6366f1] rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-sm">Buscando candidatos...</span>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Feedback Action Panel */}
      {pendingFeedback.length > 0 && !isLoading && (
        <div className="flex-shrink-0 border-t border-[#3d3d3d] bg-[#252525]">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex flex-col gap-3">
              {/* Feedback Summary */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#a0a0a0]">
                    Você avaliou{" "}
                    <span className="font-semibold text-[#f5f5f5]">
                      {pendingFeedback.length}
                    </span>{" "}
                    perfil(s):
                  </span>
                  <div className="flex items-center gap-3 text-sm">
                    {pendingFeedback.filter((f) => f.interesting).length >
                      0 && (
                      <span className="flex items-center gap-1 text-green-400">
                        <ThumbsUp className="w-4 h-4" />
                        {
                          pendingFeedback.filter((f) => f.interesting).length
                        }{" "}
                        interessante(s)
                      </span>
                    )}
                    {pendingFeedback.filter((f) => !f.interesting).length >
                      0 && (
                      <span className="flex items-center gap-1 text-red-400">
                        <ThumbsDown className="w-4 h-4" />
                        {
                          pendingFeedback.filter((f) => !f.interesting).length
                        }{" "}
                        não interessante(s)
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleClearPendingFeedback}
                  className="p-1.5 text-[#707070] hover:text-[#a0a0a0] hover:bg-[#3d3d3d] rounded-lg transition-colors"
                  title="Limpar avaliações"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Reasons Preview */}
              {pendingFeedback.some((f) => f.reason) && (
                <div className="text-xs text-[#707070] bg-[#1a1a1a] rounded-lg p-2">
                  <span className="text-[#a0a0a0]">Seus comentários: </span>
                  {pendingFeedback
                    .filter((f) => f.reason)
                    .map((f, i) => (
                      <span key={f.profileId}>
                        {i > 0 && " • "}
                        <span
                          className={
                            f.interesting
                              ? "text-green-400/70"
                              : "text-red-400/70"
                          }
                        >
                          {f.reason}
                        </span>
                      </span>
                    ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefineSearch}
                  disabled={isExporting || isExportingToClickUp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#6366f1] hover:bg-[#8b5cf6] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refinar busca
                </button>

                {/* Exportar para ClickUp se tiver vaga associada */}
                {clickUpUrl && currentJob && (
                  <button
                    onClick={handleExportToClickUp}
                    disabled={isExporting || isExportingToClickUp}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    title="Exportar candidatos para a lista no ClickUp"
                  >
                    {isExportingToClickUp ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                    {isExportingToClickUp ? "Enviando..." : "ClickUp"}
                  </button>
                )}

                <button
                  onClick={handleKeepResults}
                  disabled={isExporting || isExportingToClickUp}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {isExporting ? "Exportando..." : "CSV"}
                </button>
              </div>

              {/* Success message for ClickUp export */}
              {clickUpExportSuccess && (
                <div className="flex items-center justify-center gap-2 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 text-sm">
                  <span>✅ Candidatos exportados!</span>
                  {clickUpExportSuccess.startsWith("http") && (
                    <a
                      href={clickUpExportSuccess}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 underline hover:text-purple-300"
                    >
                      Ver no ClickUp <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <p className="text-xs text-[#707070] text-center">
                🔄 <span className="text-[#a0a0a0]">Refinar:</span> busca mais
                perfis similares aos que você gostou
                {clickUpUrl && (
                  <>
                    {" "}
                    &nbsp;•&nbsp; 💜{" "}
                    <span className="text-[#a0a0a0]">ClickUp:</span> envia para
                    a lista da vaga
                  </>
                )}
                &nbsp;•&nbsp; 📥 <span className="text-[#a0a0a0]">CSV:</span>{" "}
                baixa localmente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <footer className="flex-shrink-0 border-t border-[#2d2d2d] bg-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            placeholder={
              messages.length === 0
                ? "Descreva o perfil que você está buscando..."
                : pendingFeedback.length > 0
                ? "Ou descreva um refinamento específico..."
                : "Avalie os perfis acima ou descreva o que busca..."
            }
          />
        </div>
      </footer>
    </div>
  );
}
