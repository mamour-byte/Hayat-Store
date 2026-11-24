/** Fiche produit renvoyée par l'assistant, déjà validée côté serveur. */
export interface AIProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  inStock: boolean;
}

/** Contrat public consommé par `MorphOrb`. */
export interface AIResponse {
  conversationId: string;
  message: string;
  products?: AIProduct[];
  suggestions?: string[];
}

/** Message affiché dans le transcript conversationnel. */
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
  audio?: boolean;
  pending?: boolean;
  products?: AIProduct[];
  suggestions?: string[];
}
