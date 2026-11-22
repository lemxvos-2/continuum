import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { EmailPreference } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Lang = "pt" | "en" | "es" | "fr";

const TEXT: Record<Lang, { title: string; NONE: [string, string]; ESSENTIAL: [string, string]; ALL: [string, string]; error: string }> = {
  pt: { title: "E-mails", NONE: ["Nenhum", "Você não receberá nenhum e-mail"], ESSENTIAL: ["Essenciais", "Só avisos de conta e segurança"], ALL: ["Todos", "Recordações, novidades e avisos de conta"], error: "Não foi possível salvar" },
  en: { title: "Emails", NONE: ["None", "You won't receive any email"], ESSENTIAL: ["Essential", "Only account and security notices"], ALL: ["All", "Memories, news and account notices"], error: "Couldn't save" },
  es: { title: "Correos", NONE: ["Ninguno", "No recibirás ningún correo"], ESSENTIAL: ["Esenciales", "Solo avisos de cuenta y seguridad"], ALL: ["Todos", "Recuerdos, novedades y avisos de cuenta"], error: "No se pudo guardar" },
  fr: { title: "E-mails", NONE: ["Aucun", "Vous ne recevrez aucun e-mail"], ESSENTIAL: ["Essentiels", "Seulement les avis de compte et sécurité"], ALL: ["Tous", "Souvenirs, nouveautés et avis de compte"], error: "Impossible d'enregistrer" },
};

const OPTIONS: EmailPreference[] = ["NONE", "ESSENTIAL", "ALL"];

export function EmailPreferenceSelector() {
  const { user, updatePreferences } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const tx = TEXT[language as Lang] ?? TEXT.en;
  const value: EmailPreference = user?.emailPreference ?? "ALL";

  const onChange = async (next: string) => {
    if (!OPTIONS.includes(next as EmailPreference)) return;
    try {
      await updatePreferences({ emailPreference: next as EmailPreference });
    } catch {
      toast({ title: tx.error, variant: "destructive" });
    }
  };

  return (
    <div className="group -mx-3 flex h-16 w-[calc(100%+1.5rem)] items-center gap-4 rounded-md px-3 transition-colors hover:bg-secondary/75">
      <EnvelopeIcon className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-medium text-foreground/80 group-hover:text-foreground">{tx.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{tx[value][1]}</span>
      </span>
      <Select value={value} onValueChange={(v) => void onChange(v)}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">{tx[o][0]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
