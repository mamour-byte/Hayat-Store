import MorphOrb from '../../../components/ui/aiOrbitAssistant';
import { aiAssistantService } from '../api/ai-assistant.service';

interface AssistantWidgetProps {
  initialSuggestions?: string[];
}

/**
 * Point de montage de l'assistant : le composant visuel reste découplé de la
 * couche API. Passer `aiAssistantService.submit` directement garantit le
 * contrat `onSubmit(text, audio?, conversationId?)`.
 */
export function AssistantWidget({ initialSuggestions }: AssistantWidgetProps) {
  return (
    <MorphOrb
      onSubmit={aiAssistantService.submit}
      initialSuggestions={initialSuggestions}
    />
  );
}

export default AssistantWidget;
