import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SHOWCASE_CHARACTERS, getCharacter, type ShowcaseCharacter } from "./characters";

type Ctx = {
  characterId: string;
  character: ShowcaseCharacter;
  setCharacterId: (id: string) => void;
  all: ShowcaseCharacter[];
};

const KEY = "odyssey.showcase.character";
const ShowcaseCtx = createContext<Ctx | null>(null);

export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const [characterId, setCharacterIdState] = useState<string>(SHOWCASE_CHARACTERS[0].id);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && SHOWCASE_CHARACTERS.some((c) => c.id === saved)) {
        setCharacterIdState(saved);
      }
    } catch {}
  }, []);

  const setCharacterId = (id: string) => {
    setCharacterIdState(id);
    try { localStorage.setItem(KEY, id); } catch {}
  };

  return (
    <ShowcaseCtx.Provider value={{ characterId, character: getCharacter(characterId), setCharacterId, all: SHOWCASE_CHARACTERS }}>
      {children}
    </ShowcaseCtx.Provider>
  );
}

export function useShowcase(): Ctx {
  const ctx = useContext(ShowcaseCtx);
  if (!ctx) throw new Error("useShowcase must be used inside ShowcaseProvider");
  return ctx;
}
