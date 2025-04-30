import {
  IMovieFilterInput,
  MovieFilter,
  MovieFilterCodes,
} from "./movie.filter";

describe("MovieFilter", () => {

  describe("create", () => {
    const date = (days: number = 10) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + days);
      return date;
    };

    describe("filtros padrão", () => {
      const defaultFilterCases = [
        { description: "input nulo", input: null },
        { description: "input undefined", input: undefined },
        { description: "objeto vazio", input: {} },
      ];

      defaultFilterCases.forEach((testCase) => {
        it(`deve criar um filtro padrão quando ${testCase.description}`, () => {
          // Act
          const result = MovieFilter.create(testCase.input);

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value.dateRange).toBeDefined();
          expect(result.value.ageRating).toBeNull();
          expect(result.value.genres).toBeNull();
        });
      });
    });

    describe("validação de dateRange", () => {
      it("deve criar um filtro com dateRange válido", () => {
        // Arrange
        const input: IMovieFilterInput = {
          dateRange: { startDate: date(10), endDate: date(10) },
        };

        // Act
        const result = MovieFilter.create(input);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.dateRange).toEqual(input.dateRange);
      });

      const invalidCases = [
        {
          scenario: "startDate é nulo",
          input: {
            dateRange: {
              startDate: null,
              endDate: date(),
            },
          },
          field: "start_date",
          code: MovieFilterCodes.DATE_CANNOT_BE_NULL,
        },
        {
          scenario: "endDate é nulo",
          input: {
            dateRange: {
              startDate: date(),
              endDate: null as Date,
            },
          },
          field: "end_date",
          code: MovieFilterCodes.DATE_CANNOT_BE_NULL,
        },
        {
          scenario: "startDate é anterior à data atual",
          input: {
            dateRange: {
              startDate: date(-10),
              endDate: date(5)
            },
          },
          code: MovieFilterCodes.DATE_MUST_BE_CURRENT_OR_FUTURE,
          field: "start_date",
        },
        {
          scenario: "startDate é posterior ao limite máximo de 30 dias",
          input: {
            dateRange: {
              startDate: date(31),
              endDate: date(20),
            },
          },
          code: MovieFilterCodes.DATE_MUST_BE_WITHIN_30_DAYS,
          field: "start_date",
        },
        {
          scenario: "startDate é posterior a endDate",
          input: {
            dateRange: {
              startDate: date(10),
              endDate: date(5),
            },
          },
          code: MovieFilterCodes.START_DATE_BEFORE_END_DATE,
          field: "end_date",
        },
        {
          scenario:
            "endDate é posterior ao limite máximo de 14 dias após startDate",
          input: {
            dateRange: {
              startDate: date(10),
              endDate: date(25),
            },
          },
          code: MovieFilterCodes.END_DATE_MUST_BE_WITHIN_14_DAYS_OF_START_DATE,
          field: "end_date",
        },
      ];

      invalidCases.forEach((testCase) => {
        it(`deve falhar quando ${testCase.scenario}`, () => {
          // Act
          const result = MovieFilter.create(testCase.input);

          // Assert
          expect(result.invalid).toBe(true);
          const failures = result.failures;
          expect(failures.length).toBe(1);
          expect(failures[0].code).toBe(testCase.code);
          expect(failures[0].details).toEqual(
            expect.objectContaining({ field: testCase.field }),
          );
        });
      });
    });

    describe("validação de ageRating", () => {
      it("deve criar um filtro com ageRating válido", () => {
        // Arrange
        const input: IMovieFilterInput = { ageRating: "10" };

        // Act
        const result = MovieFilter.create(input);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.ageRating.value).toBe(input.ageRating);
      });

      it("deve falhar quando ageRating é inválido", () => {
        // Arrange
        const input: IMovieFilterInput = {
          ageRating: "INVALID",
        };

        // Act
        const result = MovieFilter.create(input);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures).toContainEqual(
          expect.objectContaining({
            code: "INVALID_AGE_RATING",
          }),
        );
      });
    });

    describe("validação de genres", () => {
      it("deve criar um filtro com genres válido", () => {
        // Arrange
        const input: IMovieFilterInput = {
          genres: ["ACTION", "COMEDY"],
        };

        // Act
        const result = MovieFilter.create(input);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.genres.count).toBe(input.genres.length);
        expect(
          result.value.genres
            .getGenres()
            .every((genre) => input.genres.includes(genre)),
        ).toBeTruthy();
      });

      it("deve falhar quando genres é inválido", () => {
        // Arrange
        const input: IMovieFilterInput = {
          genres: ["INVALID_GENRE"],
        };

        // Act
        const result = MovieFilter.create(input);

        // Assert
        expect(result.invalid).toBe(true);
      });
    });

    describe("múltiplos critérios", () => {
      it("deve criar um filtro com múltiplos critérios válidos", () => {
        // Arrange
        const input: IMovieFilterInput = {
          dateRange: { startDate: date(5), endDate: date(14) },
          ageRating: "16",
          genres: ["ACTION"],
        };

        // Act
        const result = MovieFilter.create(input);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.dateRange).toEqual(input.dateRange);
        expect(
          result.value.genres
            .getGenres()
            .every((genre) => input.genres.includes(genre)),
        );
      });

      it("deve acumular múltiplas falhas de validação", () => {
        // Arrange
        const now = new Date();
        const startDate = new Date(now.getDate() - 10); // data no passado
        const input: IMovieFilterInput = {
          dateRange: {
            startDate: startDate,
            endDate: null,
          },
          ageRating: "INVALID",
          genres: ["INVALID_GENRE"],
        };

        // Act
        const result = MovieFilter.create(input);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures.length).toBe(3);
      });
    });
  });
});
