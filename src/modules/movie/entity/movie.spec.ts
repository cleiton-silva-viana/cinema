import { faker } from "@faker-js/faker";
import {
  Movie,
  ICreateMovieInput,
  IMovieUpdateInput,
  IMovieHydrateInput,
} from "./movie";
import { MovieUID } from "./value-object/movie.uid";
import {
  ILanguageContent,
  SupportedLanguage,
} from "../../../shared/value-object/multilingual-content";
import { AgeRatingEnum } from "./value-object/age.rating";
import { PersonRole } from "./value-object/movie.contributor";
import { PersonUID } from "../../person/entity/value-object/person.uid";
import { Genre } from "./value-object/movie.genre";
import { MovieAdministrativeStatus } from "../type/movie.administrative.status";
import { DisplayPeriod } from "./value-object/display.period";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { v7 } from "uuid";

describe("Movie", () => {
  const createValidInput = (): ICreateMovieInput => ({
    title: [
      { language: SupportedLanguage.PT, text: faker.lorem.words(6) },
      { language: SupportedLanguage.EN, text: faker.lorem.words(6) },
    ],
    description: [
      { language: SupportedLanguage.PT, text: faker.lorem.paragraph() },
      { language: SupportedLanguage.EN, text: faker.lorem.paragraph() },
    ],
    ageRating: AgeRatingEnum.L,
    imageUID: "IMG." + v7(),
    contributors: [
      {
        personUid: PersonUID.create().value,
        role: PersonRole.DIRECTOR,
      },
    ],
  });

  const createHydrateInput = (overrides = {}): IMovieHydrateInput => ({
    uid: MovieUID.create().value,
    title: {
      text: faker.lorem.paragraph(),
      language: SupportedLanguage.EN,
    } as ILanguageContent,
    description: {
      text: faker.lorem.paragraph(),
      language: SupportedLanguage.EN,
    } as ILanguageContent,
    duration: 120,
    ageRating: AgeRatingEnum.L,
    status: MovieAdministrativeStatus.DRAFT,
    genres: [Genre.ACTION],
    imageUID: "IMG." + v7(),
    contributors: [
      {
        personUid: PersonUID.create().value,
        role: PersonRole.DIRECTOR,
      },
    ],
    ...overrides,
  });

  const createRelativeDate = (daysOffset: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  };

  describe("Static Methods", () => {
    describe("create", () => {
      it("deve criar um filme válido com valores mínimos", () => {
        // Arrange
        const input = createValidInput();

        // Act
        const result = Movie.create(input);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value).toBeInstanceOf(Movie);
        expect(result.value.status).toBe(MovieAdministrativeStatus.DRAFT);
      });

      describe("deve falhar quando os dados de entrada são inválidos", () => {
        // Arrange
        const testCases = [
          {
            scenario: "título for inválido",
            input: { ...createValidInput(), title: [] as Array<any> },
            expectedField: "title",
          },
          {
            scenario: "descrição for inválida",
            input: { ...createValidInput(), description: [] },
            expectedField: "description",
          },
          {
            scenario: "classificação etária for inválida",
            input: {
              ...createValidInput(),
              ageRating: "INVALID" as AgeRatingEnum,
            },
            expectedField: "ageRating",
          },
          {
            scenario: "não houver imageUID",
            input: { ...createValidInput(), imageUID: null },
            expectedField: "imageUID",
          },
        ];

        testCases.forEach(({ scenario, input, expectedField }) => {
          it(scenario, () => {
            // Act
            const result = Movie.create(input);

            // Assert
            expect(result.invalid).toBe(true);
          });
        });
      });
    });

    describe("hydrate", () => {
      it("deve hidratar um filme corretamente", () => {
        // Act
        const input = createHydrateInput();
        const movie = Movie.hydrate(input);

        // Assert
        expect(movie).toBeInstanceOf(Movie);
        expect(movie.uid.value).toBe(input.uid);
        expect(movie.status).toBe(input.status);
        expect(movie.duration.minutes).toBe(input.duration);
        expect(movie.genre.getGenres()).toEqual(input.genres);
        expect(movie.imageUID.value).toBe(input.imageUID);
        expect(movie.displayPeriod).toBeNull();
      });

      it("deve lançar erro técnico se o UID for inválido", () => {
        // Arrange
        let input = null;

        // Assert
        expect(() => Movie.hydrate(input)).toThrow();
      });

      it("deve lançar erro técnico se o UID for inválido", () => {
        // Arrange
        let input = createHydrateInput();
        input.uid = null;

        // Assert
        expect(() => Movie.hydrate(input)).toThrow();
      });
    });
  });
  describe("Instance Methods", () => {
    let movie: Movie;

    describe("update", () => {
      beforeEach(() => {
        movie = Movie.hydrate(createHydrateInput());
      });

      it("deve atualizar campos específicos mantendo os demais inalterados", () => {
        // Arrange
        const updates: IMovieUpdateInput = {
          title: [
            { language: SupportedLanguage.PT, text: "Novo Título" },
            { language: SupportedLanguage.EN, text: "New Title" },
          ],
        };

        // Act
        const result = movie.update(updates);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.title.content(SupportedLanguage.PT)).toBe(
          updates.title[0].text,
        );
        expect(result.value.title.content(SupportedLanguage.EN)).toBe(
          updates.title[1].text,
        );
      });

      describe("deve falhar quando os dados de atualização são inválidos", () => {
        // Arrange
        const futureDate = createRelativeDate(10);
        const pastDate = createRelativeDate(-10);

        const testCases = [
          {
            scenario: "título é inválido",
            updates: { title: [] as Array<ILanguageContent> },
            expectedFailuresCount: 1,
          },
          {
            scenario: "descrição é inválida",
            updates: { description: [] as Array<ILanguageContent> },
            expectedFailuresCount: 1,
          },
          {
            scenario: "duração é inválida",
            updates: { duration: -10 },
            expectedFailuresCount: 1,
          },
          {
            scenario: "gêneros são inválidos",
            updates: { genres: ["GENERO_INEXISTENTE" as any] },
            expectedFailuresCount: 1,
          },
          {
            scenario: "período de exibição é inválido",
            updates: {
              displayPeriod: {
                startDate: futureDate,
                endDate: pastDate,
              },
            },
            expectedFailuresCount: 1,
          },
          {
            scenario: "múltiplas propriedades são inválidas",
            updates: {
              title: [] as Array<ILanguageContent>,
              duration: -5,
              genres: ["GENERO_INEXISTENTE" as any],
            },
            expectedFailuresCount: 3,
          },
        ];

        testCases.forEach(({ scenario, updates, expectedFailuresCount }) => {
          it(scenario, () => {
            // Arrange
            const movie = Movie.hydrate(createHydrateInput());

            // Act
            const result = movie.update(updates as IMovieUpdateInput);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures.length).toBeGreaterThanOrEqual(
              expectedFailuresCount,
            );
          });
        });
      });
    });

    describe("toApprove", () => {
      describe("Cenários válidos", () => {
        it("deve aprovar um filme quando todos os requisitos são atendidos", () => {
          // Arrange
          const movie = Movie.hydrate(
            createHydrateInput({
              status: MovieAdministrativeStatus.PENDING_REVIEW,
              duration: 120,
              genres: [Genre.ACTION],
            }),
          );

          // Act
          const result = movie.toApprove();

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value.status).toBe(MovieAdministrativeStatus.APPROVED);
        });

        it("não deve alterar outros atributos além do status", () => {
          // Arrange
          const movie = Movie.hydrate(
            createHydrateInput({
              status: MovieAdministrativeStatus.PENDING_REVIEW,
              duration: 120,
              genres: [Genre.ACTION],
            }),
          );

          // Act
          const result = movie.toApprove();

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value.uid).toEqual(movie.uid);
          expect(result.value.title).toEqual(movie.title);
          expect(result.value.description).toEqual(movie.description);
          expect(result.value.duration).toEqual(movie.duration);
          expect(result.value.ageRating).toEqual(movie.ageRating);
          expect(result.value.genre).toEqual(movie.genre);
          expect(result.value.imageUID).toEqual(movie.imageUID);
          expect(result.value.displayPeriod).toEqual(movie.displayPeriod);
          expect(result.value.contributors).toEqual(movie.contributors);
        });

        it("deve manter o mesmo status se o filme já estiver aprovado", () => {
          // Arrange
          const approvedMovie = Movie.hydrate(
            createHydrateInput({
              status: MovieAdministrativeStatus.APPROVED,
              duration: 120,
              genres: [Genre.ACTION],
            }),
          );

          // Act
          const result = approvedMovie.toApprove();

          // Assert
          expect(result.invalid).toBe(false);
          expect(result.value.status).toBe(MovieAdministrativeStatus.APPROVED);
        });
      });

      describe("Cenários inválidos", () => {
        let baseMovie: IMovieHydrateInput;

        beforeEach(() => {
          baseMovie = createHydrateInput({
            status: MovieAdministrativeStatus.PENDING_REVIEW,
          });
        });

        const cases = [
          {
            scenario: "não tem duração definida",
            fn: (input: IMovieHydrateInput) => {
              delete input.duration;
            },
            field: "duration",
          },
          {
            scenario: "não tem gênero definido",
            fn: (input: IMovieHydrateInput) => {
              delete input.genres;
            },
            field: "genres",
          },
          {
            scenario: "não tem age rating definido",
            fn: (input: IMovieHydrateInput) => {
              delete input.ageRating;
            },
            field: "ageRating",
          },
          {
            scenario: "não tem um autor definido",
            fn: (input: IMovieHydrateInput) => {
              delete input.contributors;
              input.contributors = [
                {
                  personUid: PersonUID.create().value,
                  role: PersonRole.ACTOR,
                },
              ];
            },
            field: "contributors",
          },
        ];
        cases.forEach(({ scenario, fn, field }) => {
          it(`deve falhar quando ${scenario}`, () => {
            // Arrange
            const input = { ...baseMovie };
            fn(input);
            const movie = Movie.hydrate(input);

            // Act
            const result = movie.toApprove();

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(
              FailureCode.MISSING_REQUIRED_DATA,
            );
            expect(result.failures[0].details.field).toBe(field);
          });
        });
      });
    });

    describe("isAvailableForPeriod", () => {
      const setupAvailabilityTest = () => {
        const now = new Date();
        const startDate = new Date(now);
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 10);

        const movie = Movie.hydrate(
          createHydrateInput({
            displayPeriod: { startDate, endDate },
            status: MovieAdministrativeStatus.APPROVED,
          }),
        );

        return { now, startDate, endDate, movie };
      };

      describe("Cenários válidos", () => {
        it("deve aceitar período proposto totalmente dentro do período de exibição", () => {
          // Arrange
          const { movie } = setupAvailabilityTest();
          const periodStart = createRelativeDate(1);
          const periodEnd = createRelativeDate(9);

          // Act
          const result = movie.isAvailableForPeriod(periodStart, periodEnd);

          // Assert
          expect(result.invalid).toBe(false);
        });

        it("deve aceitar período proposto exatamente igual ao período de exibição", () => {
          // Arrange
          const { startDate, endDate, movie } = setupAvailabilityTest();
          const periodStart = new Date(startDate);
          const periodEnd = new Date(endDate);

          // Act
          const result = movie.isAvailableForPeriod(periodStart, periodEnd);

          // Assert
          expect(result.invalid).toBe(false);
        });

        it("deve aceitar período proposto com sobreposição parcial no início", () => {
          // Arrange
          const { movie } = setupAvailabilityTest();
          const periodStart = createRelativeDate(-5);
          const periodEnd = createRelativeDate(5);

          // Act
          const result = movie.isAvailableForPeriod(periodStart, periodEnd);

          // Assert
          expect(result.invalid).toBe(false);
        });

        it("deve aceitar período proposto com sobreposição parcial no fim", () => {
          // Arrange
          const { movie } = setupAvailabilityTest();
          const periodStart = createRelativeDate(5);
          const periodEnd = createRelativeDate(15);

          // Act
          const result = movie.isAvailableForPeriod(periodStart, periodEnd);

          // Assert
          expect(result.invalid).toBe(false);
        });

        it("deve aceitar período proposto com ponto de contato no início", () => {
          // Arrange
          const { startDate, movie } = setupAvailabilityTest();
          const periodStart = createRelativeDate(-10);
          const periodEnd = new Date(startDate);

          // Act
          const result = movie.isAvailableForPeriod(periodStart, periodEnd);

          // Assert
          expect(result.invalid).toBe(false);
        });

        it("deve aceitar período proposto com ponto de contato no fim", () => {
          // Arrange
          const { endDate, movie } = setupAvailabilityTest();
          const periodStart = new Date(endDate);
          const periodEnd = createRelativeDate(20);

          // Act
          const result = movie.isAvailableForPeriod(periodStart, periodEnd);

          // Assert
          expect(result.invalid).toBe(false);
        });

        it("deve aceitar período proposto que engloba completamente o período de exibição", () => {
          // Arrange
          const { movie } = setupAvailabilityTest();
          const periodStart = createRelativeDate(-5);
          const periodEnd = createRelativeDate(15);

          // Act
          const result = movie.isAvailableForPeriod(periodStart, periodEnd);

          // Assert
          expect(result.invalid).toBe(false);
        });
      });

      describe("Cenários inválidos", () => {
        it("deve falhar quando o filme está arquivado", () => {
          // Arrange
          const { startDate, endDate } = setupAvailabilityTest();
          const movie = Movie.hydrate(
            createHydrateInput({
              displayPeriod: { startDate, endDate },
              status: MovieAdministrativeStatus.ARCHIVED,
            }),
          );

          // Act
          const result = movie.isAvailableForPeriod(startDate, endDate);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(FailureCode.RESOURCE_ARCHIVED);
        });

        it("deve falhar quando o filme não tem período de exibição definido", () => {
          // Arrange
          const { startDate, endDate } = setupAvailabilityTest();
          const movie = Movie.hydrate(
            createHydrateInput({
              displayPeriod: null as DisplayPeriod,
            }),
          );

          // Act
          const result = movie.isAvailableForPeriod(startDate, endDate);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(
            FailureCode.MISSING_REQUIRED_DATA,
          );
        });

        it("deve falhar quando período proposto está antes do período de exibição", () => {
          // Arrange
          const { movie } = setupAvailabilityTest();
          const periodStart = createRelativeDate(-20);
          const periodEnd = createRelativeDate(-10);

          // Act
          const result = movie.isAvailableForPeriod(periodStart, periodEnd);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(
            FailureCode.MOVIE_NOT_AVAILABLE_IN_PERIOD,
          );
        });

        it("deve falhar quando período proposto está depois do período de exibição", () => {
          // Arrange
          const { movie } = setupAvailabilityTest();
          const periodStart = createRelativeDate(20);
          const periodEnd = createRelativeDate(30);

          // Act
          const result = movie.isAvailableForPeriod(periodStart, periodEnd);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(
            FailureCode.MOVIE_NOT_AVAILABLE_IN_PERIOD,
          );
        });

        it("deve falhar quando período proposto tem datas invertidas", () => {
          // Arrange
          const { movie } = setupAvailabilityTest();
          const periodStart = createRelativeDate(5);
          const periodEnd = createRelativeDate(2);

          // Act
          const result = movie.isAvailableForPeriod(periodStart, periodEnd);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(
            FailureCode.DATE_WITH_INVALID_SEQUENCE,
          );
        });
      });
    });
  });
});
