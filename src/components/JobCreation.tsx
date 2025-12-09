import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Briefcase,
  User,
  CheckCircle,
  ArrowRight,
  Loader2,
  Home,
  Send,
  X,
} from "lucide-react";
import type { Message, JobData } from "../types";
import { sendJobMessage, createJob } from "../services/api";

interface JobCreationProps {
  onJobCreated: (
    job: JobData,
    searchQuery: string,
    clickUpUrl?: string
  ) => void;
  onCancel: () => void;
}

// Calcula o progresso da vaga
function getProgress(jobData: JobData): {
  done: number;
  total: number;
  items: { label: string; done: boolean }[];
} {
  const fields = [
    { key: "title", label: "Título" },
    { key: "area", label: "Área" },
    { key: "seniority", label: "Senioridade" },
    { key: "workFormat", label: "Formato" },
    { key: "salary", label: "Salário" },
    { key: "contractType", label: "Contrato" },
  ];

  const items = fields.map((f) => ({
    label: f.label,
    done: !!jobData[f.key as keyof JobData],
  }));

  const done = items.filter((i) => i.done).length;
  return { done, total: fields.length, items };
}

export function JobCreation({ onJobCreated, onCancel }: JobCreationProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Vou te ajudar a criar uma nova vaga rapidamente. 🎯\n\nVamos lá! Me conta:\n\n1. Nome da vaga (ex: Desenvolvedor Backend, Analista de CS)\n2. Área (Tecnologia, Produto, Vendas, CS, Marketing, RH, Financeiro...)\n3. Senioridade (Junior, Pleno ou Sênior)\n4. Motivo da abertura (Substituição, Aumento de time ou Novo projeto)\n5. Para quem vai reportar",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [jobData, setJobData] = useState<JobData>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJobCreated, setIsJobCreated] = useState(false);
  const [createdJobData, setCreatedJobData] = useState<{
    job: JobData;
    searchQuery: string;
    clickUpUrl?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const progress = getProgress(jobData);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setInputValue("");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Se a vaga já foi criada e o usuário quer buscar candidatos
    if (isJobCreated && createdJobData) {
      const searchTriggers = [
        "buscar candidatos",
        "buscar",
        "começar busca",
        "procurar",
        "encontrar candidatos",
        "iniciar busca",
      ];

      if (
        searchTriggers.some((trigger) =>
          content.toLowerCase().includes(trigger)
        )
      ) {
        const finalMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "🚀 Perfeito! Vou iniciar a busca de candidatos agora...",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, finalMessage]);

        setTimeout(() => {
          onJobCreated(
            createdJobData.job,
            createdJobData.searchQuery,
            createdJobData.clickUpUrl
          );
        }, 1500);
        return;
      }
    }

    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendJobMessage(
        content,
        conversationHistory,
        jobData
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.assistantMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setJobData(response.currentJobData);
      setIsComplete(response.isComplete);

      // Se a vaga já foi criada, atualiza os dados
      if (isJobCreated && createdJobData) {
        setCreatedJobData({
          ...createdJobData,
          job: response.currentJobData,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao processar mensagem"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await createJob(jobData as JobData);

      // Adiciona mensagem de sucesso
      const successMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ Vaga criada com sucesso!\n\n${
          response.clickUpListUrl
            ? `📋 Lista no ClickUp: ${response.clickUpListUrl}\n\n`
            : ""
        }💬 Quer fazer algum ajuste na vaga antes de buscar candidatos?\n\nVocê pode:\n• Modificar qualquer informação (salário, formato, etc)\n• Adicionar mais detalhes\n• Ou digitar "buscar candidatos" para começar a busca`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, successMessage]);
      setIsJobCreated(true);
      setCreatedJobData({
        job: response.job as JobData,
        searchQuery: response.searchQuery,
        clickUpUrl: response.clickUpListUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar vaga");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      {/* Sidebar com progresso */}
      <aside className="w-72 border-r border-[#2d2d2d] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2d2d2d]">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-2 text-[#707070] hover:text-[#f5f5f5] hover:bg-[#2d2d2d] rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img
                src="/logo.png"
                alt="AtrAI"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-semibold text-[#f5f5f5] text-sm">
                Nova Vaga
              </h1>
              <p className="text-xs text-[#707070]">Definindo detalhes</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="p-4 border-b border-[#2d2d2d]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#707070] uppercase tracking-wider">
              Progresso
            </span>
            <span className="text-xs text-[#6366f1] font-medium">
              {progress.done}/{progress.total}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#2d2d2d] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] transition-all duration-300"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {progress.items.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    item.done ? "bg-green-500/20" : "bg-[#2d2d2d]"
                  }`}
                >
                  {item.done ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <div className="w-1.5 h-1.5 bg-[#505050] rounded-full" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    item.done ? "text-[#a0a0a0]" : "text-[#505050]"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Job Preview */}
        {jobData.title && (
          <div className="p-4 border-b border-[#2d2d2d]">
            <span className="text-xs text-[#707070] uppercase tracking-wider">
              Prévia
            </span>
            <h2 className="font-medium text-[#f5f5f5] mt-2">{jobData.title}</h2>
            {(jobData.area || jobData.seniority) && (
              <p className="text-xs text-[#707070] mt-1">
                {[jobData.area, jobData.seniority].filter(Boolean).join(" • ")}
              </p>
            )}
            {jobData.workFormat && (
              <p className="text-xs text-[#505050] mt-1">
                {jobData.workFormat}
              </p>
            )}
            {jobData.salary && (
              <p className="text-xs text-green-400/70 mt-1">{jobData.salary}</p>
            )}
          </div>
        )}

        {/* Action */}
        <div className="p-4 mt-auto border-t border-[#2d2d2d] space-y-2">
          {isComplete && !isJobCreated && !isCreating && (
            <button
              onClick={handleCreateJob}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Criar Vaga
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isCreating && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2d2d2d] rounded-lg">
              <Loader2 className="w-4 h-4 text-[#6366f1] animate-spin" />
              <span className="text-sm text-[#a0a0a0]">Criando...</span>
            </div>
          )}

          {isJobCreated && createdJobData && (
            <>
              <button
                onClick={() => {
                  onJobCreated(
                    createdJobData.job,
                    createdJobData.searchQuery,
                    createdJobData.clickUpUrl
                  );
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#6366f1] hover:bg-[#8b5cf6] text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Buscar Candidatos
              </button>
              <p className="text-xs text-center text-[#707070]">
                Ou faça ajustes no chat acima
              </p>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="space-y-4">
                {/* User message */}
                {message.role === "user" && (
                  <div className="flex justify-end">
                    <div className="flex items-start gap-3 max-w-[80%]">
                      <div className="bg-[#6366f1] text-white rounded-2xl rounded-br-sm px-4 py-3">
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3d3d3d] flex items-center justify-center">
                        <User className="w-4 h-4 text-[#a0a0a0]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Assistant message */}
                {message.role === "assistant" && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <p className="text-[#f5f5f5] text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
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
                  <span className="text-sm">Processando...</span>
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
        {!isCreating && (
          <div className="border-t border-[#2d2d2d] p-4">
            <div className="max-w-3xl mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputValue);
                }}
                className="flex items-center gap-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    isJobCreated
                      ? 'Digite "buscar candidatos" ou faça ajustes na vaga...'
                      : "Responda às perguntas sobre a vaga..."
                  }
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
        )}
      </main>
    </div>
  );
}
