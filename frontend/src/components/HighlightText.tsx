// Removed unused ReactNode import

interface Props {
  text: string;
  keywords?: string[];
}

/**
 * Helper component to highlight matched keywords within a text string.
 */
export const HighlightText = ({ text, keywords }: Props) => {
  if (!text) return null;
  if (!keywords || keywords.length === 0) return <>{text}</>;

  // Escape keywords for regex safety
  const safeKeywords = keywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const parts = text.split(new RegExp(`(${safeKeywords.join("|")})`, "gi"));

  return (
    <span>
      {parts.map((part, i) =>
        safeKeywords.some((k) => k.toLowerCase() === part.toLowerCase()) ? (
          <span
            key={i}
            className="bg-yellow-200 text-black font-semibold rounded px-0.5"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};
