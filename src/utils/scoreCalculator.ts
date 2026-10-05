import { Category, GameMode, PeerVoteEntry, PlayerAnswerReview } from '../types/game';
import { normalizeSpanish, validarPalabraPorCategoria, wordStartsWithLetter } from './dictionary';

export { wordStartsWithLetter, normalizeSpanish };

export function normalizeWord(str: string): string {
  return normalizeSpanish(str);
}

export function calculateAutomaticScores(
  answersByPlayer: Record<string, Record<string, string>>, // playerId -> categoryId -> word
  currentLetter: string,
  categories: Category[],
  gameMode: GameMode = 'classic',
  peerVotes: Record<string, PeerVoteEntry> = {}
): Record<string, Record<string, PlayerAnswerReview>> {
  const result: Record<string, Record<string, PlayerAnswerReview>> = {};
  const playerIds = Object.keys(answersByPlayer);

  for (const pid of playerIds) {
    result[pid] = {};
  }

  for (const cat of categories) {
    const catId = cat.id;
    const isSubjective = cat.validationType === 'subjective' || gameMode !== 'classic';

    // Map player normalized answers to detect duplicates
    const playerToNorm: Record<string, string> = {};

    for (const pid of playerIds) {
      const rawWord = answersByPlayer[pid]?.[catId] || '';
      const norm = normalizeSpanish(rawWord);
      playerToNorm[pid] = norm;
    }

    for (const pid of playerIds) {
      const rawWord = (answersByPlayer[pid]?.[catId] || '').trim();
      const norm = playerToNorm[pid];
      const voteKey = `${pid}_${catId}`;
      const voteEntry = peerVotes[voteKey] || { upvotes: [], downvotes: [] };

      const upCount = voteEntry.upvotes.length;
      const downCount = voteEntry.downvotes.length;

      // 1. Check empty
      if (!rawWord || norm.length === 0) {
        result[pid][catId] = {
          points: 0,
          status: 'invalid',
          verified: true,
          notes: 'Casilla vacía',
          upvotesCount: upCount,
          downvotesCount: downCount,
          isSubjective,
        };
        continue;
      }

      // 2. Check initial letter
      if (!wordStartsWithLetter(rawWord, currentLetter)) {
        result[pid][catId] = {
          points: 0,
          status: 'invalid',
          verified: true,
          notes: `No empieza con "${currentLetter}"`,
          upvotesCount: upCount,
          downvotesCount: downCount,
          isSubjective,
        };
        continue;
      }

      // Duplicate count
      const sameWordCount = playerIds.filter(otherPid => playerToNorm[otherPid] === norm).length;
      const isRepeated = sameWordCount > 1;

      // In non-classic creative modes (Crazy, IRL, etc.):
      if (gameMode !== 'classic') {
        if (downCount > upCount && (upCount + downCount > 0)) {
          result[pid][catId] = {
            points: 0,
            status: 'invalid',
            verified: true,
            notes: `Rechazada por la sala (${downCount} 👎)`,
            upvotesCount: upCount,
            downvotesCount: downCount,
            isSubjective: true,
          };
        } else if (upCount > 0 || downCount === 0) {
          const pts = isRepeated ? 50 : 100;
          result[pid][catId] = {
            points: pts,
            status: isRepeated ? 'valid_repeated' : 'valid_unique',
            verified: true,
            notes: isRepeated ? `Repetida (+50)` : `Aceptada (+100)`,
            upvotesCount: upCount,
            downvotesCount: downCount,
            isSubjective: true,
          };
        } else {
          result[pid][catId] = {
            points: 0,
            status: 'invalid',
            verified: true,
            notes: 'Pendiente de Votos',
            upvotesCount: upCount,
            downvotesCount: downCount,
            isSubjective: true,
          };
        }
        continue;
      }

      // In Classic Mode: Strict Dictionary / Category Dataset Check
      const check = validarPalabraPorCategoria(rawWord, catId, currentLetter);

      // Check if players democratically overridden via votes
      const hasPeerApproval = upCount > downCount && upCount >= 1;
      const hasPeerRejection = downCount > upCount && downCount >= 1;

      if (hasPeerRejection) {
        result[pid][catId] = {
          points: 0,
          status: 'invalid',
          verified: true,
          notes: `Rechazada por la sala (${downCount} 👎)`,
          upvotesCount: upCount,
          downvotesCount: downCount,
          isSubjective,
        };
      } else if (check.isValid || hasPeerApproval) {
        // Valid either by dictionary or peer approval
        const basePts = isRepeated ? 50 : 100;
        const noteText = hasPeerApproval
          ? `Aprobada por la sala (${upCount} 👍) • ${isRepeated ? 'Repetida +50' : 'Única +100'}`
          : `${check.reason} • ${isRepeated ? 'Repetida +50' : 'Única +100'}`;

        result[pid][catId] = {
          points: basePts,
          status: isRepeated ? 'valid_repeated' : 'valid_unique',
          verified: true,
          notes: noteText,
          upvotesCount: upCount,
          downvotesCount: downCount,
          isSubjective,
        };
      } else {
        // STRICT: Not in dictionary and not approved -> 0 POINTS
        result[pid][catId] = {
          points: 0,
          status: 'invalid',
          verified: true,
          notes: check.reason,
          upvotesCount: upCount,
          downvotesCount: downCount,
          isSubjective,
        };
      }
    }
  }

  return result;
}

export async function calculateAutomaticScoresAsync(
  answersByPlayer: Record<string, Record<string, string>>,
  currentLetter: string,
  categories: Category[],
  gameMode: GameMode = 'classic',
  peerVotes: Record<string, PeerVoteEntry> = {}
): Promise<Record<string, Record<string, PlayerAnswerReview>>> {
  // Synchronous strict validation with our rich RAM sets
  return calculateAutomaticScores(answersByPlayer, currentLetter, categories, gameMode, peerVotes);
}
