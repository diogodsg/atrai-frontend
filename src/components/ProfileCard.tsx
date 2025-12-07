import { useState, useEffect, useRef } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  MapPin,
  Briefcase,
  Building2,
  User,
} from "lucide-react";
import type { Profile, ProfileFeedback } from "../types";

interface ProfileCardProps {
  profile: Profile;
  onFeedback?: (feedback: ProfileFeedback) => void;
  isEvaluated?: boolean;
  currentFeedback?: ProfileFeedback | null;
}

export function ProfileCard({
  profile,
  onFeedback,
  isEvaluated,
  currentFeedback,
}: ProfileCardProps) {
  // Inicializa com o feedback atual se existir
  const [feedbackGiven, setFeedbackGiven] = useState<"like" | "dislike" | null>(
    currentFeedback ? (currentFeedback.interesting ? "like" : "dislike") : null
  );
  const [reason, setReason] = useState(currentFeedback?.reason || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Envia feedback imediatamente quando clica em like/dislike (com toggle)
  const handleFeedback = (interesting: boolean) => {
    if (isEvaluated) return;

    const newFeedbackType = interesting ? "like" : "dislike";

    // Se clicou no mesmo, desmarca
    if (feedbackGiven === newFeedbackType) {
      setFeedbackGiven(null);
      setReason("");
      onFeedback?.({
        profileId: profile.profile_id,
        profileName: profile.full_name,
        interesting,
        removed: true, // Indica remoção
      });
      return;
    }

    setFeedbackGiven(newFeedbackType);
    setReason("");

    // Envia imediatamente
    onFeedback?.({
      profileId: profile.profile_id,
      profileName: profile.full_name,
      interesting,
      reason: undefined,
    });
  };

  // Atualiza feedback quando o motivo mudar (com debounce)
  useEffect(() => {
    if (!feedbackGiven) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onFeedback?.({
        profileId: profile.profile_id,
        profileName: profile.full_name,
        interesting: feedbackGiven === "like",
        reason: reason.trim() || undefined,
      });
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    reason,
    feedbackGiven,
    profile.profile_id,
    profile.full_name,
    onFeedback,
  ]);

  const seniorityColors: Record<string, string> = {
    Junior: "bg-blue-500/20 text-blue-400",
    Pleno: "bg-green-500/20 text-green-400",
    Senior: "bg-purple-500/20 text-purple-400",
    Especialista: "bg-orange-500/20 text-orange-400",
    Gerente: "bg-yellow-500/20 text-yellow-400",
    Diretor: "bg-red-500/20 text-red-400",
    "C-Level": "bg-pink-500/20 text-pink-400",
  };

  return (
    <div
      className={`bg-[#2d2d2d] rounded-xl border transition-all ${
        feedbackGiven === "like"
          ? "border-green-500/50"
          : feedbackGiven === "dislike"
          ? "border-red-500/50 opacity-60"
          : "border-[#3d3d3d] hover:border-[#4d4d4d]"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#3d3d3d] flex items-center justify-center overflow-hidden">
            {profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.full_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
            ) : null}
            <User
              className={`w-6 h-6 text-[#707070] ${
                profile.profile_image_url ? "hidden" : ""
              }`}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[#f5f5f5] truncate">
                  {profile.full_name}
                </h3>
                <p className="text-sm text-[#a0a0a0] line-clamp-2">
                  {profile.headline}
                </p>
              </div>

              {/* Seniority Badge */}
              {profile.seniority && (
                <span
                  className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                    seniorityColors[profile.seniority] ||
                    "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {profile.seniority}
                </span>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-[#a0a0a0]">
              {profile.current_job_title && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {profile.current_job_title}
                </span>
              )}
              {profile.current_company && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {profile.current_company}
                </span>
              )}
              {(profile.city || profile.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {[profile.city, profile.state].filter(Boolean).join(", ")}
                </span>
              )}
            </div>

            {/* Area */}
            {profile.area && (
              <p className="text-xs text-[#707070] mt-2">
                {profile.macroarea && `${profile.macroarea} • `}
                {profile.area}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#3d3d3d]">
          {/* Feedback Buttons */}
          <div className="flex items-center gap-2">
            {isEvaluated ? (
              <span className="text-sm text-green-400">✓ Já avaliado</span>
            ) : (
              <>
                <button
                  onClick={() => handleFeedback(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                    feedbackGiven === "like"
                      ? "bg-green-500/30 text-green-300 ring-2 ring-green-500/50"
                      : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  {feedbackGiven === "like" ? "Interessante ✓" : "Interessante"}
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                    feedbackGiven === "dislike"
                      ? "bg-red-500/30 text-red-300 ring-2 ring-red-500/50"
                      : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  {feedbackGiven === "dislike"
                    ? "Não interessante ✓"
                    : "Não interessante"}
                </button>
              </>
            )}
          </div>

          {/* LinkedIn Link */}
          {profile.profile_url && (
            <a
              href={
                profile.profile_url.startsWith("http")
                  ? profile.profile_url
                  : `https://${profile.profile_url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5]/20 transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              LinkedIn
            </a>
          )}
        </div>

        {/* Reason Input - aparece após dar feedback */}
        {feedbackGiven && (
          <div className="mt-3">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Por que ${
                feedbackGiven === "like" ? "interessante" : "não interessante"
              }? (opcional)`}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg text-sm text-[#f5f5f5] placeholder-[#707070] outline-none focus:border-[#4d4d4d]"
            />
            {reason && (
              <p className="mt-1 text-xs text-[#707070]">
                ✓ Motivo será incluído no refinamento
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
