import { User, Bot } from "lucide-react";
import type { Message, ProfileFeedback } from "../types";
import { ProfileCard } from "./ProfileCard";

interface ChatMessageProps {
  message: Message;
  onProfileFeedback?: (feedback: ProfileFeedback) => void;
  evaluatedProfiles?: Set<string>;
  pendingFeedback?: ProfileFeedback[];
}

export function ChatMessage({
  message,
  onProfileFeedback,
  evaluatedProfiles,
  pendingFeedback,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-[#3d3d3d]" : "bg-[#e07a4f]"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-[#a0a0a0]" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block text-left ${
            isUser ? "bg-[#3d3d3d] rounded-2xl rounded-tr-sm px-4 py-3" : ""
          }`}
        >
          <p className="text-[#f5f5f5] whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Search Criteria */}
        {message.searchCriteria && (
          <div className="mt-4 p-4 bg-[#2d2d2d] rounded-xl border border-[#3d3d3d]">
            <h4 className="text-sm font-medium text-[#a0a0a0] mb-2">
              Critérios de busca:
            </h4>
            <p className="text-sm text-[#f5f5f5] whitespace-pre-wrap">
              {message.searchCriteria}
            </p>
          </div>
        )}

        {/* SQL Query (collapsed) */}
        {message.query && (
          <details className="mt-3">
            <summary className="text-xs text-[#707070] cursor-pointer hover:text-[#a0a0a0]">
              Ver query SQL
            </summary>
            <pre className="mt-2 p-3 bg-[#1a1a1a] rounded-lg text-xs text-[#a0a0a0] overflow-x-auto">
              {message.query}
            </pre>
          </details>
        )}

        {/* Profile Cards */}
        {message.profiles && message.profiles.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium text-[#a0a0a0]">
              {message.totalProfiles &&
              message.totalProfiles > message.profiles.length ? (
                <>
                  <span className="text-[#e07a4f] font-semibold">
                    {message.totalProfiles}
                  </span>{" "}
                  candidatos encontrados
                  <span className="text-[#707070]">
                    {" "}
                    (exibindo {message.profiles.length})
                  </span>
                </>
              ) : (
                <>{message.profiles.length} candidatos encontrados:</>
              )}
            </h4>
            <div className="grid gap-3">
              {message.profiles.map((profile) => (
                <ProfileCard
                  key={profile.profile_id}
                  profile={profile}
                  onFeedback={onProfileFeedback}
                  isEvaluated={evaluatedProfiles?.has(profile.profile_id)}
                  currentFeedback={
                    pendingFeedback?.find(
                      (f) => f.profileId === profile.profile_id
                    ) || null
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p
          className={`text-xs text-[#505050] mt-2 ${
            isUser ? "text-right" : ""
          }`}
        >
          {message.timestamp.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
