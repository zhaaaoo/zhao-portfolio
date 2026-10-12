import { createContext, useContext } from 'react';

// the skill sticker currently dropped on the desktop, if any
export const HighlightContext = createContext<string | null>(null);
export const useHighlight = () => useContext(HighlightContext);
