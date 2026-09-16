export interface InteractionRecord {
  date: string;
  type: string;
}

export interface Contact {
  id: string;
  name: string;
  tier: number;
  lastInteraction: string | null;
  interactionType: string | null;
  history: InteractionRecord[];
  notes: string;
  birthday: string;
  hobbies: string;
  knowFrom: string;
  photoUri?: string;
}
