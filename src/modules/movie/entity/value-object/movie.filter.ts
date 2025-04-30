import { Result, success, failure } from "../../../../shared/result/result";
import { SimpleFailure } from "../../../../shared/failure/simple.failure.type";
import { AgeRating } from "./age.rating";
import { MovieGenre } from "./movie.genre";
import { Assert } from "../../../../shared/assert/assert";
import { not } from "../../../../shared/assert/not";
import { isNull } from "../../../../shared/validator/validator";

export interface IMovieFilterInput {
  genres?: string[];
  ageRating?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export const MovieFilterCodes = {
  DATE_CANNOT_BE_NULL: "DATE_CANNOT_BE_NULL",
  DATE_MUST_BE_CURRENT_OR_FUTURE: "DATE_MUST_BE_CURRENT_OR_FUTURE",
  DATE_MUST_BE_WITHIN_30_DAYS: "DATE_MUST_BE_WITHIN_30_DAYS",
  START_DATE_BEFORE_END_DATE: "START_DATE_BEFORE_END_DATE",
  END_DATE_MUST_BE_WITHIN_14_DAYS_OF_START_DATE:
    "END_DATE_MUST_BE_WITHIN_14_DAYS_OF_START_DATE",
};

export class MovieFilter {

  /**
   * Propriedade estática para definir o período máximo de dias no futuro
   * Que a data inicial deve possuir
   * */

  public static readonly MAX_FUTURE_DAYS = 30;
  /**
   * Propriedade estática para definir o período máximo entre data inicial e final
   */
  public static readonly MAX_DATE_RANGE_DAYS = 14;

  private constructor(
    public readonly dateRange?: {
      startDate: Date;
      endDate: Date;
    },
    public readonly ageRating?: AgeRating,
    public readonly genres?: MovieGenre,
  ) {}

  public static create(input: IMovieFilterInput): Result<MovieFilter> {
    if (isNull(input)) {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);

      return success(
        new MovieFilter(
          {
            startDate: today,
            endDate: endDate,
          },
          null,
          null,
        ),
      );
    }

    const failures: SimpleFailure[] = [];
    let dateRangeValue = null;
    let ageRatingValue = null;
    let genresValue = null;

    if (input.dateRange) {
      const { startDate, endDate } = input.dateRange;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxFutureDate = new Date(today);
      maxFutureDate.setDate(today.getDate() + MovieFilter.MAX_FUTURE_DAYS);

      Assert.untilFirstFailure(
        failures,
        { field: "start_date" },
        not.null(startDate, MovieFilterCodes.DATE_CANNOT_BE_NULL),
        not.dateBefore(
          startDate,
          today,
          MovieFilterCodes.DATE_MUST_BE_CURRENT_OR_FUTURE,
        ), // <<< ponto de erro
        not.dateAfter(
          startDate,
          maxFutureDate,
          MovieFilterCodes.DATE_MUST_BE_WITHIN_30_DAYS,
        ),
      );

      if (failures.length === 0) {
        const maxEndDate = new Date();
        maxEndDate.setDate(
          maxFutureDate.getDate() + MovieFilter.MAX_DATE_RANGE_DAYS,
        );

        Assert.untilFirstFailure(
          failures,
          { field: "end_date" },
          not.null(endDate, MovieFilterCodes.DATE_CANNOT_BE_NULL),
          not.dateAfter(
            startDate,
            endDate,
            MovieFilterCodes.START_DATE_BEFORE_END_DATE,
          ),
          not.dateAfter(
            endDate,
            maxEndDate,
            MovieFilterCodes.END_DATE_MUST_BE_WITHIN_14_DAYS_OF_START_DATE,
          ),
        );

        if (failures.length === 0) dateRangeValue = input.dateRange;
      }
    }

    if (input.ageRating) {
      const ageRatingResult = AgeRating.create(input.ageRating);
      if (ageRatingResult.invalid) {
        failures.push(...ageRatingResult.failures);
      } else {
        ageRatingValue = ageRatingResult.value;
      }
    }

    if (input.genres) {
      const genreResult = MovieGenre.create(input.genres);
      if (genreResult.invalid) {
        failures.push(...genreResult.failures);
      } else {
        genresValue = genreResult.value;
      }
    }

    if (failures.length > 0) return failure(failures);

    if (!dateRangeValue && !ageRatingValue && !genresValue) {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);

      dateRangeValue = {
        startDate: today,
        endDate: endDate,
      };
    }

    return success(
      new MovieFilter(dateRangeValue, ageRatingValue, genresValue),
    );
  }
}
