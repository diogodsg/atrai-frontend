import { useState } from "react";
import { ChatV2 } from "./components/ChatV2";
import { JobCreation } from "./components/JobCreation";
import type { JobData } from "./types";
import { Briefcase, Search, ArrowRight } from "lucide-react";

type AppMode = "home" | "job-creation" | "search";

function App() {
  const [mode, setMode] = useState<AppMode>("home");
  const [currentJob, setCurrentJob] = useState<JobData | null>(null);
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>("");
  const [clickUpUrl, setClickUpUrl] = useState<string | undefined>();

  const handleJobCreated = (
    job: JobData,
    searchQuery: string,
    clickUpUrlParam?: string
  ) => {
    setCurrentJob(job);
    setInitialSearchQuery(searchQuery);
    setClickUpUrl(clickUpUrlParam);
    setMode("search");
  };

  const handleStartDirectSearch = () => {
    setCurrentJob(null);
    setInitialSearchQuery("");
    setClickUpUrl(undefined);
    setMode("search");
  };

  const handleNewJob = () => {
    setCurrentJob(null);
    setInitialSearchQuery("");
    setClickUpUrl(undefined);
    setMode("job-creation");
  };

  const handleBackToHome = () => {
    setMode("home");
  };

  // Home screen
  if (mode === "home") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] px-4">
        {/* Background gradient sutil */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6366f1]/5 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8b5cf6]/3 rounded-full blur-[128px]" />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 w-full max-w-4xl">
          {/* Logo e título */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-8">
              <img
                src="/logo.png"
                alt="AtrAI"
                className="w-36 h-36 rounded-2xl shadow-2xl shadow-[#6366f1]/25"
              />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Atr<span className="text-[#6366f1]">AI</span>
            </h1>
            <p className="text-xl text-[#707070] max-w-md mx-auto font-light">
              Recrutamento inteligente com IA
            </p>
          </div>

          {/* Cards de ação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card principal - Criar Vaga */}
            <button
              onClick={handleNewJob}
              className="group relative flex flex-col p-8 bg-gradient-to-br from-[#1a1a1a] to-[#141414] hover:from-[#1f1f1f] hover:to-[#181818] rounded-2xl border border-[#2d2d2d] hover:border-[#6366f1]/50 text-left transition-all duration-300 overflow-hidden"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#6366f1]/10 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center mb-6 shadow-lg shadow-[#6366f1]/20 group-hover:shadow-[#6366f1]/40 transition-shadow">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-3">
                  Nova Vaga
                </h2>
                <p className="text-[#707070] mb-6 leading-relaxed">
                  Crie uma vaga estruturada com questionário inteligente e
                  integração automática com ClickUp.
                </p>
                <div className="flex items-center gap-2 text-[#6366f1] font-medium">
                  Começar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </button>

            {/* Card secundário - Busca Direta */}
            <button
              onClick={handleStartDirectSearch}
              className="group relative flex flex-col p-8 bg-[#141414] hover:bg-[#181818] rounded-2xl border border-[#2d2d2d] hover:border-[#3d3d3d] text-left transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-[#252525] group-hover:bg-[#2d2d2d] flex items-center justify-center mb-6 transition-colors">
                <Search className="w-7 h-7 text-[#707070] group-hover:text-[#a0a0a0] transition-colors" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">
                Busca Rápida
              </h2>
              <p className="text-[#606060] mb-6 leading-relaxed">
                Busque candidatos diretamente usando linguagem natural, sem
                criar uma vaga.
              </p>
              <div className="flex items-center gap-2 text-[#606060] group-hover:text-[#808080] font-medium transition-colors">
                Explorar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Job creation flow
  if (mode === "job-creation") {
    return (
      <JobCreation
        onJobCreated={handleJobCreated}
        onCancel={handleBackToHome}
      />
    );
  }

  // Search mode
  return (
    <ChatV2
      currentJob={currentJob}
      initialSearchQuery={initialSearchQuery}
      clickUpUrl={clickUpUrl}
      onBackToHome={handleBackToHome}
    />
  );
}

export default App;
