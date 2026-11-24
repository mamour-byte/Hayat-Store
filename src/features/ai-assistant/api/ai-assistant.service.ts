import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';
import { tokenStorage } from '../../../lib/storage/token.storage';
import type { AIProduct, AIResponse } from '../types/ai-assistant.types';

/** Doit rester aligné sur la limite du contrôleur NestJS (10 Mo). */
export const AI_MAX_AUDIO_BYTES = 10 * 1024 * 1024;

interface BackendAssistantResponse {
  conversationId?: string;
  reply?: string;
  message?: string;
  language?: string;
  products?: unknown;
  suggestions?: unknown;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizePrice = (value: unknown): number => {
  const price = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(price) && price >= 0 ? price : 0;
};

const normalizeProduct = (value: unknown): AIProduct | null => {
  if (!isRecord(value)) return null;

  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!id || !name) return null;

  const imageUrl = typeof value.imageUrl === 'string' ? value.imageUrl : '';
  const slug =
    typeof value.slug === 'string' && value.slug.trim()
      ? value.slug.trim()
      : id;

  return {
    id,
    name,
    price: normalizePrice(value.price),
    imageUrl,
    productUrl:
      typeof value.productUrl === 'string' && value.productUrl.trim()
        ? value.productUrl
        : `/products/${encodeURIComponent(slug)}`,
    inStock: value.inStock === true || value.available === true,
  };
};

const normalizeProducts = (value: unknown): AIProduct[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const products = value
    .map(normalizeProduct)
    .filter((product): product is AIProduct => product !== null)
    .slice(0, 8);
  return products.length > 0 ? products : undefined;
};

const normalizeSuggestions = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const suggestions = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, 140))
    .filter((item) => item.length > 0)
    .slice(0, 4);
  return suggestions.length > 0 ? suggestions : undefined;
};

const mapResponse = (data: BackendAssistantResponse): AIResponse => ({
  conversationId: typeof data.conversationId === 'string' ? data.conversationId : '',
  message:
    (typeof data.message === 'string' && data.message.trim()) ||
    (typeof data.reply === 'string' && data.reply.trim()) ||
    "Je n'ai pas pu obtenir de réponse. Pouvez-vous reformuler ?",
  products: normalizeProducts(data.products),
  suggestions: normalizeSuggestions(data.suggestions),
});

const audioFileName = (mime: string): string => {
  const ext = mime.includes('mp4')
    ? 'm4a'
    : mime.includes('ogg')
      ? 'ogg'
      : mime.includes('wav')
        ? 'wav'
        : mime.includes('mpeg')
          ? 'mp3'
          : 'webm';
  return `message-vocal.${ext}`;
};

async function chat(text: string, conversationId?: string): Promise<AIResponse> {
  const { data } = await apiClient.post<BackendAssistantResponse>(
    API_ENDPOINTS.AI_ASSISTANT.CHAT,
    {
      message: text,
      language: 'auto',
      sessionId: tokenStorage.getSessionId(),
      ...(conversationId ? { conversationId } : {}),
    },
  );
  return mapResponse(data);
}

async function voice(audio: Blob, conversationId?: string): Promise<AIResponse> {
  if (audio.size === 0) {
    throw new Error("L'enregistrement est vide. Réessayez.");
  }
  if (audio.size > AI_MAX_AUDIO_BYTES) {
    throw new Error('Fichier audio trop volumineux (10 Mo maximum).');
  }

  const form = new FormData();
  const mime = audio.type.split(';')[0].trim() || 'audio/webm';
  form.append('audio', audio, audioFileName(mime));
  form.append('language', 'auto');
  form.append('sessionId', tokenStorage.getSessionId());
  if (conversationId) form.append('conversationId', conversationId);

  const { data } = await apiClient.post<BackendAssistantResponse>(
    API_ENDPOINTS.AI_ASSISTANT.VOICE,
    form,
    // `null` supprime le Content-Type JSON par défaut du client afin que le
    // navigateur positionne le boundary multipart/form-data.
    { headers: { 'Content-Type': null } },
  );
  return mapResponse(data);
}

/**
 * `submit` est volontairement une fonction autonome (sans `this`) pour pouvoir
 * être passée directement à `MorphOrb.onSubmit`.
 */
function submit(
  text: string,
  audio?: Blob,
  conversationId?: string,
): Promise<AIResponse> {
  return audio ? voice(audio, conversationId) : chat(text, conversationId);
}

export const aiAssistantService = { submit, chat, voice };

export default aiAssistantService;
