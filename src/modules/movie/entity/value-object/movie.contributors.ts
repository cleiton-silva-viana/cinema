import { failure, Result, success } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import {
  MovieContributor,
  IMovieContributorInput,
  PersonRole,
} from "./movie.contributor";
import { TechnicalError } from "../../../../shared/error/technical.error";
import { isNull } from "../../../../shared/validator/validator";

export const contributorsCodes = {
  THE_MOVIE_MISSING_CONTRIBUTORS: "THE_MOVIE_MISSING_CONTRIBUTORS",
  MOVIE_DIRECTOR_REQUIRED: "MOVIE_DIRECTOR_REQUIRED",
  NULL_ARGUMENT: "NULL_ARGUMENT",
  EMPTY_VALUES: "EMPTY_VALUES",
};

/**
 * Value object que representa todos os contribuidores de um filme,
 * organizados por papel.
 */
export class MovieContributors {
  private readonly contributorsByRole: Map<PersonRole, MovieContributor[]>;

  private constructor(contributors: MovieContributor[]) {
    this.contributorsByRole = new Map<PersonRole, MovieContributor[]>();

    contributors.forEach((contributor) => {
      const role = contributor.role;

      if (!this.contributorsByRole.has(role))
        this.contributorsByRole.set(role, []);

      this.contributorsByRole.get(role).push(contributor);
    });
  }

  /**
   * Cria uma instância de MovieContributors com validação
   * @param contributors Array de MovieContributor ou MovieContributorInput
   * @returns Result<MovieContributors>
   */
  public static create(
    contributors: MovieContributor[] | IMovieContributorInput[],
  ): Result<MovieContributors> {
    const failures: SimpleFailure[] = [];

    if (isNull(contributors) || contributors.length === 0) {
      failures.push({
        code: contributorsCodes.THE_MOVIE_MISSING_CONTRIBUTORS,
        details: { field: "contributors" },
      });
      return failure(failures);
    }

    const processedContributors: MovieContributor[] = [];

    const isInstanceOfMovieContributor =
      contributors[0] instanceof MovieContributor;

    if (isInstanceOfMovieContributor) {
      processedContributors.push(...(contributors as Array<MovieContributor>));
    }

    if (!isInstanceOfMovieContributor) {
      for (const contributor of contributors as IMovieContributorInput[]) {
        const result = MovieContributor.create(contributor);
        if (result.invalid) {
          failures.push(...result.failures);
        } else {
          processedContributors.push(result.value);
        }
      }
    }

    if (failures.length > 0) return failure(failures);

    const hasDirector = processedContributors.some(
      (contributor) => contributor.role === PersonRole.DIRECTOR,
    );

    if (!hasDirector) {
      failures.push({
        code: contributorsCodes.MOVIE_DIRECTOR_REQUIRED,
        details: { field: "contributors" },
      });
      return failure(failures);
    }

    return success(new MovieContributors(processedContributors));
  }

  // Vamos melhorar a mensagem de erro
  /**
   * Cria uma instância de MovieContributors a partir de dados já validados
   * @param contributors Array de MovieContributor
   * @returns MovieContributors
   */
  public static hydrate(
    contributors: IMovieContributorInput[],
  ): MovieContributors {
    TechnicalError.if(isNull(contributors), contributorsCodes.NULL_ARGUMENT, {
      message: "Contributors array cannot be null",
    });

    TechnicalError.if(
      contributors.length === 0,
      contributorsCodes.EMPTY_VALUES,
      {
        message: "Contributors array cannot be empty",
      },
    );

    const processedContributors: MovieContributor[] = [];

    for (const contributor of contributors as IMovieContributorInput[]) {
      const result = MovieContributor.create(contributor);
      if (!result.invalid) {
        processedContributors.push(result.value);
      }
    }

    return new MovieContributors(processedContributors);
  }

  /**
   * Retorna todos os contribuidores
   * @returns Array de MovieContributor
   */
  public getAll(): MovieContributor[] {
    return Array.from(this.contributorsByRole.values()).flat();
  }

  /**
   * Retorna todos os diretores
   * @returns Array de MovieContributor
   */
  public getDirectors(): MovieContributor[] {
    return this.contributorsByRole.get(PersonRole.DIRECTOR) || [];
  }

  /**
   * Retorna todos os atores e atrizes
   * @returns Array de MovieContributor
   */
  public getActors(): MovieContributor[] {
    const actors = this.contributorsByRole.get(PersonRole.ACTOR) || [];
    const actresses = this.contributorsByRole.get(PersonRole.ACTRESS) || [];
    return [...actors, ...actresses];
  }

  /**
   * Retorna todos os contribuidores com um papel específico
   * @param role Papel desejado
   * @returns Array de MovieContributor
   */
  public getByRole(role: PersonRole): MovieContributor[] {
    return this.contributorsByRole.get(role) || [];
  }

  /**
   * Retorna a quantidade de contribuidores
   */
  public get count(): number {
    return this.getAll().length;
  }

  /**
   * Retorna todos os papéis presentes na coleção
   */
  public get roles(): PersonRole[] {
    return Array.from(this.contributorsByRole.keys());
  }
}
