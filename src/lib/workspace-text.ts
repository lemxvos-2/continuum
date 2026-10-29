import { useLanguage } from "@/contexts/LanguageContext";

const TEXT = {
  en: { title: "Workspaces", yourWorkspaces: "Your workspaces", all: "All", main: "Main", create: "New workspace", createButton: "Create", rename: "Rename workspace", save: "Save", placeholder: "e.g. Journal, Studies, Work", delete: "Delete workspace", error: "Something went wrong. Try again.", freeWorkspaceLimit: "Free includes one custom workspace. Upgrade to VISION for unlimited workspaces.", confirmDelete: (n: string) => `Delete "${n}"? Its notes and entities stay in "All".`, belongs: "Workspaces" },
  pt: { title: "Espaços", yourWorkspaces: "Seus espaços", all: "Tudo", main: "Principal", create: "Novo espaço", createButton: "Criar", rename: "Renomear espaço", save: "Salvar", placeholder: "ex: Diário, Estudos, Trabalho", delete: "Excluir espaço", error: "Algo deu errado. Tente de novo.", freeWorkspaceLimit: "O plano Free inclui um espaço personalizado. Assine o VISION para ter espaços ilimitados.", confirmDelete: (n: string) => `Excluir "${n}"? As notas e entidades continuam em "Tudo".`, belongs: "Espaços" },
  es: { title: "Espacios", yourWorkspaces: "Tus espacios", all: "Todo", main: "Principal", create: "Nuevo espacio", createButton: "Crear", rename: "Renombrar espacio", save: "Guardar", placeholder: "ej: Diario, Estudios, Trabajo", delete: "Eliminar espacio", error: "Algo salió mal. Inténtalo de nuevo.", freeWorkspaceLimit: "El plan Free incluye un espacio personalizado. Pásate a VISION para tener espacios ilimitados.", confirmDelete: (n: string) => `¿Eliminar "${n}"? Las notas y entidades siguen en "Todo".`, belongs: "Espacios" },
  fr: { title: "Espaces", yourWorkspaces: "Vos espaces", all: "Tout", main: "Principal", create: "Nouvel espace", createButton: "Créer", rename: "Renommer l'espace", save: "Enregistrer", placeholder: "ex : Journal, Études, Travail", delete: "Supprimer l'espace", error: "Une erreur est survenue. Réessayez.", freeWorkspaceLimit: "L’offre Free inclut un espace personnalisé. Passez à VISION pour des espaces illimités.", confirmDelete: (n: string) => `Supprimer « ${n} » ? Les notes et entités restent dans « Tout ».`, belongs: "Espaces" },
};

export function useWorkspaceText() {
  const { language } = useLanguage();
  return TEXT[(language as keyof typeof TEXT) ?? "en"] ?? TEXT.en;
}
