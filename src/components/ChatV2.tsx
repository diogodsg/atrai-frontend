import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Users,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Download,
  Loader2,
  ExternalLink,
  Home,
  Briefcase,
  Upload,
  Send,
  Sparkles,
  Check,
  X,
  MapPin,
  User,
} from "lucide-react";
import type { Message, ProfileFeedback, JobData, Profile } from "../types";
import {
  sendMessage,
  exportToCsv,
  exportAllCandidatesToClickUp,
} from "../services/api";

interface ChatV2Props {
  currentJob?: JobData | null;
  initialSearchQuery?: string;
  clickUpUrl?: string;
  onBackToHome?: () => void;
}

// Componente de Card de Perfil Compacto
function CompactProfileCard({
  profile,
  feedback,
  onFeedback,
  isDisabled,
}: {
  profile: Profile;
  feedback?: ProfileFeedback;
  onFeedback: (
    profileId: string,
    interesting: boolean | null,
    reason?: string
  ) => void;
  isDisabled?: boolean;
}) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState(feedback?.reason || "");

  const handleFeedback = (interesting: boolean) => {
    if (isDisabled) return;

    // Toggle - se já está marcado, desmarca
    if (feedback?.interesting === interesting) {
      onFeedback(profile.profile_id, null);
      setShowReasonInput(false);
      setReason("");
      return;
    }

    onFeedback(profile.profile_id, interesting);
    setShowReasonInput(true);
  };

  const handleReasonSubmit = () => {
    if (feedback) {
      onFeedback(profile.profile_id, feedback.interesting, reason);
    }
    setShowReasonInput(false);
  };

  return (
    <div
      className={`group relative bg-[#252525] rounded-lg border transition-all ${
        feedback?.interesting === true
          ? "border-green-500/50 bg-green-500/5"
          : feedback?.interesting === false
          ? "border-red-500/30 opacity-50"
          : "border-transparent hover:border-[#3d3d3d]"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#3d3d3d] flex items-center justify-center overflow-hidden">
          {profile.profile_image_url ? (
            <img
              src={profile.profile_image_url}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <User className="w-5 h-5 text-[#707070]" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-[#f5f5f5] text-sm truncate">
              {profile.full_name}
            </h4>
            {profile.seniority && (
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#3d3d3d] text-[#a0a0a0]">
                {profile.seniority}
              </span>
            )}
          </div>
          <p className="text-xs text-[#707070] truncate">
            {profile.current_job_title}
            {profile.current_company && ` @ ${profile.current_company}`}
          </p>
          {(profile.city || profile.state) && (
            <p className="text-xs text-[#505050] truncate mt-0.5">
              <MapPin className="w-3 h-3 inline mr-1" />
              {[profile.city, profile.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleFeedback(true)}
            disabled={isDisabled}
            className={`p-1.5 rounded-lg transition-colors ${
              feedback?.interesting === true
                ? "bg-green-500/20 text-green-400"
                : "text-[#505050] hover:text-green-400 hover:bg-green-500/10"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Interessante"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFeedback(false)}
            disabled={isDisabled}
            className={`p-1.5 rounded-lg transition-colors ${
              feedback?.interesting === false
                ? "bg-red-500/20 text-red-400"
                : "text-[#505050] hover:text-red-400 hover:bg-red-500/10"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Não interessante"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          <a
            href={
              profile.profile_url.startsWith("http")
                ? profile.profile_url
                : `https://${profile.profile_url}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-[#505050] hover:text-[#a0a0a0] hover:bg-[#3d3d3d] transition-colors"
            title="Ver LinkedIn"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Reason input - mostra sempre que há feedback */}
      {feedback && showReasonInput && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Por que esse perfil é ${
                feedback.interesting ? "interessante" : "não interessante"
              }? (opcional)`}
              className="flex-1 bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-3 py-1.5 text-sm text-[#f5f5f5] placeholder-[#505050] focus:outline-none focus:border-green-500/50"
              onKeyDown={(e) => e.key === "Enter" && handleReasonSubmit()}
              autoFocus
            />
            <button
              onClick={handleReasonSubmit}
              className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Show saved reason com botão para editar */}
      {feedback?.reason && !showReasonInput && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2">
            <p className="flex-1 text-xs text-green-400/70 bg-green-500/10 rounded px-2 py-1">
              💡 {feedback.reason}
            </p>
            <button
              onClick={() => setShowReasonInput(true)}
              className="p-1 text-[#505050] hover:text-[#a0a0a0] rounded"
              title="Editar motivo"
            >
              <span className="text-xs">✏️</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChatV2({
  currentJob,
  initialSearchQuery,
  clickUpUrl,
  onBackToHome,
}: ChatV2Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<Map<string, ProfileFeedback>>(
    new Map()
  );
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingClickUp, setIsExportingClickUp] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSearchRef = useRef(false);

  // Get all profiles from messages
  const allProfiles = messages
    .flatMap((m) => m.profiles || [])
    .filter(
      (p, i, arr) => arr.findIndex((x) => x.profile_id === p.profile_id) === i
    );

  const interestingProfiles = allProfiles.filter(
    (p) => feedbackMap.get(p.profile_id)?.interesting === true
  );
  const notInterestingProfiles = allProfiles.filter(
    (p) => feedbackMap.get(p.profile_id)?.interesting === false
  );

  // Auto-search on mount
  useEffect(() => {
    if (initialSearchQuery && !autoSearchRef.current) {
      autoSearchRef.current = true;
      handleSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setError(null);
    setInputValue("");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendMessage(
        query,
        conversationHistory,
        Array.from(feedbackMap.values())
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (
    profileId: string,
    interesting: boolean | null,
    reason?: string
  ) => {
    const profile = allProfiles.find((p) => p.profile_id === profileId);
    if (!profile) return;

    setFeedbackMap((prev) => {
      const next = new Map(prev);
      if (interesting === null) {
        next.delete(profileId);
      } else {
        next.set(profileId, {
          profileId,
          profileName: profile.full_name,
          interesting,
          reason,
        });
      }
      return next;
    });
  };

  const handleRefineSearch = () => {
    const interesting = interestingProfiles.map((p) => ({
      name: p.full_name,
      reason: feedbackMap.get(p.profile_id)?.reason,
    }));
    const notInteresting = notInterestingProfiles.map((p) => p.full_name);

    let query = "Refine a busca: ";
    if (interesting.length > 0) {
      query += `Gostei de ${interesting
        .map((i) => i.name + (i.reason ? ` (${i.reason})` : ""))
        .join(", ")}. `;
    }
    if (notInteresting.length > 0) {
      query += `Não gostei de ${notInteresting.join(", ")}. `;
    }
    query += "Busque perfis similares aos que gostei.";

    handleSearch(query);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const blob = await exportToCsv(
        conversationHistory,
        Array.from(feedbackMap.values())
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candidatos_${
        currentJob?.title?.replace(/\s+/g, "_") || "busca"
      }_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClickUp = async () => {
    if (!clickUpUrl || !currentJob?.title) return;

    const listIdMatch = clickUpUrl.match(/clickup\.com\/(\d+)/);
    if (!listIdMatch) return;

    setIsExportingClickUp(true);
    setExportSuccess(null);

    try {
      // Monta o histórico da conversa e feedback para buscar TODOS os candidatos do filtro
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await exportAllCandidatesToClickUp(
        listIdMatch[1],
        currentJob.title,
        conversationHistory,
        Array.from(feedbackMap.values())
      );

      if (result.success) {
        setExportSuccess(
          `${result.candidatesCount} candidatos exportados!` +
            (result.clickUpTaskUrl ? ` ${result.clickUpTaskUrl}` : "")
        );
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar");
    } finally {
      setIsExportingClickUp(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#2d2d2d] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2d2d2d]">
          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="p-2 text-[#707070] hover:text-[#f5f5f5] hover:bg-[#2d2d2d] rounded-lg transition-colors"
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
              <h1 className="font-semibold text-[#f5f5f5] text-sm">AtrAI</h1>
              <p className="text-xs text-[#707070]">Recrutamento IA</p>
            </div>
          </div>
        </div>

        {/* Job Info */}
        {currentJob && (
          <div className="p-4 border-b border-[#2d2d2d]">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-[#6366f1]" />
              <span className="text-xs text-[#707070] uppercase tracking-wider">
                Vaga Ativa
              </span>
            </div>
            <h2 className="font-medium text-[#f5f5f5] text-sm">
              {currentJob.title}
            </h2>
            <p className="text-xs text-[#707070] mt-1">
              {currentJob.area} • {currentJob.seniority}
            </p>
            {currentJob.workFormat && (
              <p className="text-xs text-[#505050] mt-1">
                {currentJob.workFormat}
              </p>
            )}
            {clickUpUrl && (
              <a
                href={clickUpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 mt-3 text-xs text-purple-400 hover:text-purple-300"
              >
                <ExternalLink className="w-3 h-3" />
                Ver no ClickUp
              </a>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="p-4 border-b border-[#2d2d2d] max-h-[50vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#707070]" />
            <span className="text-xs text-[#707070] uppercase tracking-wider">
              Avaliação
            </span>
          </div>
          <div className="space-y-3">
            {/* Total */}
            <div className="p-2 bg-[#252525] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#a0a0a0]">
                  Total encontrados
                </span>
                <span className="text-sm font-semibold text-[#f5f5f5]">
                  {allProfiles.length}
                </span>
              </div>
            </div>

            {/* Atendem à vaga */}
            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-green-400/90 font-medium">
                  Atendem à vaga
                </span>
                <span className="text-sm font-semibold text-green-400">
                  {interestingProfiles.length}
                </span>
              </div>
              {interestingProfiles.length > 0 && (
                <div className="space-y-1">
                  {interestingProfiles.map((profile) => (
                    <div
                      key={profile.profile_id}
                      className="text-[11px] text-green-400/70 truncate"
                    >
                      • {profile.full_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Não atendem */}
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-red-400/90 font-medium">
                  Não atendem
                </span>
                <span className="text-sm font-semibold text-red-400">
                  {notInterestingProfiles.length}
                </span>
              </div>
              {notInterestingProfiles.length > 0 && (
                <div className="space-y-1">
                  {notInterestingProfiles.map((profile) => (
                    <div
                      key={profile.profile_id}
                      className="text-[11px] text-red-400/70 truncate line-through opacity-60"
                    >
                      • {profile.full_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Não avaliados */}
            {allProfiles.length >
              interestingProfiles.length + notInterestingProfiles.length && (
              <div className="p-2 bg-[#2d2d2d] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#707070]">Não avaliados</span>
                  <span className="text-sm font-semibold text-[#a0a0a0]">
                    {allProfiles.length -
                      interestingProfiles.length -
                      notInterestingProfiles.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 mt-auto border-t border-[#2d2d2d] space-y-2">
          {feedbackMap.size > 0 && (
            <button
              onClick={handleRefineSearch}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6366f1] hover:bg-[#8b5cf6] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refinar Busca
            </button>
          )}

          {clickUpUrl && currentJob && (
            <button
              onClick={handleExportClickUp}
              disabled={isExportingClickUp || allProfiles.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isExportingClickUp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Enviar ao ClickUp
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={isExporting || allProfiles.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#f5f5f5] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Baixar CSV
          </button>

          {exportSuccess && (
            <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400">Exportado!</span>
              {exportSuccess.startsWith("http") && (
                <a
                  href={exportSuccess}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto"
                >
                  <ExternalLink className="w-3 h-3 text-green-400" />
                </a>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg shadow-[#6366f1]/20">
                  <img
                    src="/logo.png"
                    alt="AtrAI"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-semibold text-[#f5f5f5] mb-2">
                  {currentJob
                    ? `Buscando para: ${currentJob.title}`
                    : "Busca de Candidatos"}
                </h2>
                <p className="text-[#707070] max-w-md mx-auto">
                  {currentJob
                    ? "Aguarde enquanto buscamos os melhores candidatos..."
                    : "Descreva o perfil que você está buscando usando linguagem natural."}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="space-y-4">
                {/* User message */}
                {message.role === "user" && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] bg-[#6366f1] text-white rounded-2xl rounded-br-sm px-4 py-3">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                )}

                {/* Assistant message */}
                {message.role === "assistant" && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#f5f5f5] text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>

                        {message.totalProfiles !== undefined && (
                          <p className="text-xs text-[#707070] mt-2">
                            Mostrando {message.profiles?.length || 0} de{" "}
                            {message.totalProfiles} resultados
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Profiles Grid */}
                    {message.profiles && message.profiles.length > 0 && (
                      <div className="ml-11 grid gap-2">
                        {message.profiles.map((profile) => (
                          <CompactProfileCard
                            key={profile.profile_id}
                            profile={profile}
                            feedback={feedbackMap.get(profile.profile_id)}
                            onFeedback={handleFeedback}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2 text-[#707070]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Buscando candidatos...</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <X className="w-4 h-4" />
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-[#2d2d2d] p-4">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(inputValue);
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Descreva o perfil que está buscando..."
                className="flex-1 bg-[#252525] border border-[#3d3d3d] rounded-xl px-4 py-3 text-[#f5f5f5] placeholder-[#505050] focus:outline-none focus:border-[#6366f1] transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-3 bg-[#6366f1] hover:bg-[#8b5cf6] text-white rounded-xl transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
