// Normalized Levenshtein distance for string similarity
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Remove accents, lowercase, and normalize whitespace
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, ' ')           // Normalize multiple spaces
    .trim();
}

// Remove common surname prefixes for comparison
const SURNAME_PREFIXES = ['da', 'de', 'do', 'das', 'dos', 'e'];

export function normalizeSurname(str: string): string {
  const normalized = normalizeString(str);
  return normalized
    .split(' ')
    .filter(word => !SURNAME_PREFIXES.includes(word))
    .join(' ');
}

// Get name parts (for order comparison)
export function getNameParts(str: string): string[] {
  return normalizeSurname(str).split(' ').filter(Boolean).sort();
}

// Calculate similarity percentage between two strings
export function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  
  if (norm1 === norm2) return 100;
  
  const maxLength = Math.max(norm1.length, norm2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(norm1, norm2);
  return Math.round((1 - distance / maxLength) * 100);
}

// Check if names have the same parts in any order
function hasSameNameParts(name1: string, name2: string): boolean {
  const parts1 = getNameParts(name1);
  const parts2 = getNameParts(name2);
  
  if (parts1.length !== parts2.length) return false;
  
  return parts1.every((part, index) => {
    const similarity = calculateSimilarity(part, parts2[index]);
    return similarity >= 85;
  });
}

// Check for surname variations
function hasSurnameVariation(name1: string, name2: string): boolean {
  const norm1 = normalizeSurname(name1);
  const norm2 = normalizeSurname(name2);
  
  return norm1 === norm2;
}

export interface DuplicateMatch {
  id: string;
  name: string;
  city: string;
  similarity: number;
  matchType: 'exact' | 'very_similar' | 'similar' | 'name_order' | 'surname_variation';
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  matches: DuplicateMatch[];
}

// Main duplicate detection function
export function findDuplicates(
  newName: string,
  existingAthletes: Array<{ id: string; name: string; city: string }>,
  minSimilarity: number = 85
): DuplicateCheckResult {
  const matches: DuplicateMatch[] = [];
  const normalizedNewName = normalizeString(newName);
  
  if (!normalizedNewName || normalizedNewName.length < 2) {
    return { hasDuplicates: false, matches: [] };
  }

  for (const athlete of existingAthletes) {
    const normalizedExisting = normalizeString(athlete.name);
    
    // Check for exact match (after normalization)
    if (normalizedNewName === normalizedExisting) {
      matches.push({
        id: athlete.id,
        name: athlete.name,
        city: athlete.city,
        similarity: 100,
        matchType: 'exact',
      });
      continue;
    }
    
    // Check for surname variation (da Silva vs Silva)
    if (hasSurnameVariation(newName, athlete.name)) {
      matches.push({
        id: athlete.id,
        name: athlete.name,
        city: athlete.city,
        similarity: 98,
        matchType: 'surname_variation',
      });
      continue;
    }
    
    // Check for name order inversion (João Pedro vs Pedro João)
    if (hasSameNameParts(newName, athlete.name)) {
      matches.push({
        id: athlete.id,
        name: athlete.name,
        city: athlete.city,
        similarity: 95,
        matchType: 'name_order',
      });
      continue;
    }
    
    // Calculate similarity
    const similarity = calculateSimilarity(newName, athlete.name);
    
    if (similarity >= 95) {
      matches.push({
        id: athlete.id,
        name: athlete.name,
        city: athlete.city,
        similarity,
        matchType: 'very_similar',
      });
    } else if (similarity >= minSimilarity) {
      matches.push({
        id: athlete.id,
        name: athlete.name,
        city: athlete.city,
        similarity,
        matchType: 'similar',
      });
    }
  }

  // Sort by similarity (highest first)
  matches.sort((a, b) => b.similarity - a.similarity);

  return {
    hasDuplicates: matches.length > 0,
    matches: matches.slice(0, 5), // Return top 5 matches
  };
}

// Get match type label in Portuguese
export function getMatchTypeLabel(matchType: DuplicateMatch['matchType']): string {
  switch (matchType) {
    case 'exact':
      return 'Nome idêntico';
    case 'very_similar':
      return 'Muito parecido';
    case 'similar':
      return 'Parecido';
    case 'name_order':
      return 'Ordem invertida';
    case 'surname_variation':
      return 'Variação de sobrenome';
    default:
      return 'Similar';
  }
}
