export type GameMode = 'classic' | 'crazy' | 'irl_objects' | 'ecuador' | 'custom';

export type CategoryValidationType = 'dictionary' | 'subjective';

export interface Category {
  id: string;
  name: string;
  icon: string;
  placeholder: string;
  description?: string;
  ecuadorExample?: string;
  validationType?: CategoryValidationType;
}

export interface PlayerAnswerReview {
  points: number; // 0, 50, 100, etc.
  status: 'valid_unique' | 'valid_repeated' | 'invalid' | 'bonus' | 'custom';
  verified: boolean;
  notes?: string;
  upvotesCount?: number;
  downvotesCount?: number;
  isSubjective?: boolean;
}

export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  totalRoundPoints: number;
  isHost: boolean;
  isReady: boolean;
  currentRoundAnswers: Record<string, string>; // categoryId -> word
  roundScoreDetails: Record<string, PlayerAnswerReview>; // categoryId -> review
  screamedChantin: boolean;
  connected: boolean;
}

export type RoomState = 
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'freeze_countdown'
  | 'reviewing'
  | 'round_results'
  | 'game_over';

export interface GameSettings {
  roundDuration: number;
  gameMode: GameMode;
  totalRounds: number;
  categories: Category[];
  autoScoreAssistant: boolean;
  gracePeriodSeconds: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  isShout?: boolean;
  shoutType?: 'chantin' | 'paralo' | 'novale' | 'pilas' | 'general';
  timestamp: number;
}

export interface RoundHistoryItem {
  round: number;
  letter: string;
  answers: Record<string, Record<string, string>>; // playerId -> categoryId -> answer
  scores: Record<string, number>; // playerId -> points scored
  screamedBy?: string;
}

export interface PeerVoteEntry {
  upvotes: string[]; // playerIds who voted "Aceptar" / "👍"
  downvotes: string[]; // playerIds who voted "Rechazar" / "👎"
}

export interface RoomData {
  code: string;
  hostId: string;
  state: RoomState;
  currentRound: number;
  currentLetter: string;
  usedLetters: string[];
  settings: GameSettings;
  players: Record<string, Player>;
  peerVotes: Record<string, PeerVoteEntry>; // key `${targetPlayerId}_${catId}`
  timerRemaining: number;
  timerTotal: number;
  freezeCountdownRemaining?: number;
  stoppedByPlayer?: { id: string; nickname: string; avatar: string };
  roundHistory: RoundHistoryItem[];
  chatMessages: ChatMessage[];
  createdAt: number;
}

export interface LetterOption {
  letter: string;
  used: boolean;
}
