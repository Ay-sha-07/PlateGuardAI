import { Languages } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, useLanguage, type LanguageCode } from "@/lib/i18n";
export function LanguageSelector({compact=false,inline=false}:{compact?:boolean;inline?:boolean}) {
 const {language,setLanguage,t}=useLanguage();
 return <Select value={language} onValueChange={(v)=>setLanguage(v as LanguageCode)}>
  <SelectTrigger
   className={
    inline
     ? "h-auto w-auto gap-0 border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:text-foreground [&>svg:last-child]:hidden"
     : compact?"h-9 w-[52px] border-border bg-background/90 px-2":"h-10 w-[170px]"
   }
   aria-label={t("SelectLanguage")}
  >
   {compact?<Languages className="size-5"/>:<><Languages className="mr-2 size-4"/><SelectValue placeholder={t("Language")}/></>}
  </SelectTrigger>
  <SelectContent align="end">{LANGUAGES.map(x=><SelectItem key={x.code} value={x.code}>{x.label}</SelectItem>)}</SelectContent>
 </Select>;
}
