/**
 * Enumeração que representa a Classificação Etária dos Filmes de acordo com o padrão brasileiro.
 *
 * Este enum define as categorias de classificação etária que devem ser utilizadas em todo o sistema
 * para garantir a consistência na exibição e restrição de conteúdos para os diferentes públicos.
 *
 * Nota: Adaptado para o padrão brasileiro.
 * link:
 *
 * @enum {string}
 */
export enum AgeRating {
  /** Livre para todos os públicos */
  L = "L",
  /** Não recomendado para menores de 10 anos */
  Ten = "10",
  /** Não recomendado para menores de 12 anos */
  Twelve = "12",
  /** Não recomendado para menores de 14 anos */
  Fourteen = "14",
  /** Não recomendado para menores de 16 anos */
  Sixteen = "16",
  /** Não recomendado para menores de 18 anos */
  Eighteen = "18",
}

interface AgeRange {
  rating: AgeRating;
  min: number;
}

const ageRanges: AgeRange[] = [
  { rating: AgeRating.L, min: 0, },
  { rating: AgeRating.Ten, min: 10  },
  { rating: AgeRating.Twelve, min: 12  },
  { rating: AgeRating.Fourteen, min: 14  },
  { rating: AgeRating.Sixteen, min: 16  },
  { rating: AgeRating.Eighteen, min: 18 },
];

export function getAgeRating(age: number): AgeRating {
  if (age < 0) return AgeRating.L;
  const sortedRanges = [...ageRanges].sort((a, b) => b.min - a.min);
  const range = sortedRanges.find(r => age >= r.min);
  return range ? range.rating : AgeRating.Eighteen;
}
