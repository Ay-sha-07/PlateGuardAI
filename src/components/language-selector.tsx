import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, useLanguage, type LanguageCode } from "@/lib/i18n";

/**
 * Display order follows LANGUAGES (English A–Z by language name).
 * Icon is a plain Globe — no Languages "A" glyph and no chevron badge.
 */
export function LanguageSelector({
  compact = false,
  inline = false,
}: {
  compact?: boolean;
  inline?: boolean;
}) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Select value={language} onValueChange={(v) => setLanguage(v as LanguageCode)}>
      <SelectTrigger
        className={
          inline
            ? // Bottom-nav: icon only — no border, chevron, or focus ring “blob”
              "h-9 w-9 shrink-0 justify-center gap-0 border-0 bg-transparent p-0 text-muted-foreground shadow-none ring-0 focus:ring-0 focus-visible:ring-0 data-[state=open]:bg-transparent hover:text-foreground [&>svg:last-child]:hidden"
            : compact
              ? "h-9 w-9 justify-center border-0 bg-transparent p-0 shadow-none ring-0 focus:ring-0 [&>svg:last-child]:hidden"
              : "h-10 w-[170px]"
        }
        aria-label={t("SelectLanguage")}
      >
        {compact || inline ? (
          <Globe className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        ) : (
          <>
            <Globe className="mr-2 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <SelectValue placeholder={t("Language")} />
          </>
        )}
      </SelectTrigger>
      <SelectContent align="end" className="max-h-72">
        {LANGUAGES.map((x) => (
          <SelectItem key={x.code} value={x.code}>
            {x.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
