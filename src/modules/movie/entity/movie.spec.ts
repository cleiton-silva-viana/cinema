import { faker } from "@faker-js/faker/locale/pt_PT";
import { CreateMovieInput, Movie, MovieCodes, MovieUpdateInput } from "./movie";
import { MovieUID } from "./value-object/movie.uid";
import { AgeRatingEnum } from "./value-object/age.rating";
import { MovieAdministrativeStatus } from "../type/movie.administrative.status";
import { Genre } from "./value-object/movie.genre";
import { Image } from "../../image/entity/image";
import { PersonRole } from "./value-object/movie.contributor";
import {
  LanguageContent,
  SupportedLanguage,
} from "../../../shared/value-object/multilingual-content";
import { PersonUID } from "../../person/value-object/person.uid";
import { DisplayPeriod } from "./value-object/display.period";

describe("Movie", () => {
  const createValidInput = (): CreateMovieInput => ({
    title: [
      { language: SupportedLanguage.PT, text: faker.lorem.words(6) },
      { language: SupportedLanguage.EN, text: faker.lorem.words(6) },
    ],
    description: [
      { language: SupportedLanguage.PT, text: faker.lorem.paragraph() },
      { language: SupportedLanguage.EN, text: faker.lorem.paragraph() },
    ],
    ageRating: AgeRatingEnum.L,
    images: {
      poster: {} as Image, // Mock da imagem
    },
    contributors: [
      {
        personUid: PersonUID.create().value,
        movieUid: MovieUID.create().value,
        role: PersonRole.DIRECTOR,
      },
    ],
  });

  const createHydrateInput = (overrides = {}) => ({
    uid: MovieUID.create().value,
    title: {
      text: faker.lorem.paragraph(),
      language: SupportedLanguage.EN,
    } as LanguageContent,
    description: {
      text: faker.lorem.paragraph(),
      language: SupportedLanguage.EN,
    } as LanguageContent,
    duration: 120,
    ageRating: AgeRatingEnum.L,
    status: MovieAdministrativeStatus.DRAFT,
    genres: [Genre.ACTION],
    images: {
      poster: {} as Image,
    },
    contributors: [
      {
        personUid: PersonUID.create().value,
        movieUid: MovieUID.create().value,
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
            input: { ...createValidInput(), title: [] },
          },
          {
            scenario: "descrição for inválida",
            input: { ...createValidInput(), description: [] },
          },
          {
            scenario: "classificação etária for inválida",
            input: {
              ...createValidInput(),
              ageRating: "INVALID" as AgeRatingEnum,
            },
          },
          {
            scenario: "não houver poster",
            input: { ...createValidInput(), images: {} as any },
          },
        ];

        testCases.forEach(({ scenario, input }) => {
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
        expect(movie.images.poster).toBe(input.images.poster);
        expect(movie.images.banner).not.toBeDefined();
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
        const updates: MovieUpdateInput = {
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
            updates: { title: [] as Array<LanguageContent> },
            expectedFailuresCount: 1,
          },
          {
            scenario: "descrição é inválida",
            updates: { description: [] as Array<LanguageContent> },
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
              title: [] as Array<LanguageContent>,
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
            const result = movie.update(updates as MovieUpdateInput);

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
          expect(result.value.images).toEqual(movie.images);
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
        // Utilizando createHydrateInput como base
        const baseMovie = createHydrateInput({
          status: MovieAdministrativeStatus.PENDING_REVIEW,
        });

        it("deve falhar quando o filme não tem duração definida", () => {
          // Arrange
          const movieData = { ...baseMovie };
          delete movieData.duration;
          const movie = Movie.hydrate(movieData);

          // Act
          const result = movie.toApprove();

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(
            MovieCodes.MOVIE_MISSING_DURATION,
          );
        });

        it("deve falhar quando o filme não tem gênero definido", () => {
          // Arrange
          const movieData = { ...baseMovie };
          delete movieData.genres;
          const movie = Movie.hydrate(movieData);

          // Act
          const result = movie.toApprove();

          // Assert
          expect(result.invalid).toBe(true);
          //  expect(result.failures[0].code).toBe(MovieCodes.MOVIE_MISSING_GENRE);
        });

        it("deve falhar quando o filme não tem poster", () => {
          // Arrange
          const movieData = { ...baseMovie };
          delete movieData.images.poster;
          const movie = Movie.hydrate(movieData);

          // Act
          const result = movie.toApprove();

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(MovieCodes.MOVIE_MISSING_POSTER);
        });

        it("deve falhar quando o filme não tem classificação etária", () => {
          // Arrange
          const movieData = { ...baseMovie };
          delete movieData.ageRating;
          const movie = Movie.hydrate(movieData);

          // Act
          const result = movie.toApprove();

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(
            MovieCodes.MOVIE_MISSING_AGE_RATING,
          );
        });

        it("deve falhar quando o filme não tem diretor", () => {
          // Arrange
          const movieData = { ...baseMovie };
          delete movieData.contributors;
          movieData.contributors = [
            {
              personUid: PersonUID.create().value,
              movieUid: MovieUID.create().value,
              role: PersonRole.ACTOR,
            },
          ];
          const movie = Movie.hydrate(movieData);

          // Act
          const result = movie.toApprove();

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(
            MovieCodes.MOVIE_MISSING_DIRECTOR,
          );
        });
      });
    });

    describe("toArchive", () => {
      it("deve arquivar um filme quando não tem período de exibição definido", () => {
        // Arrange
        const movieWithoutDisplayPeriod = Movie.hydrate(
          createHydrateInput({
            displayPeriod: null,
          }),
        );

        // Act
        const result = movieWithoutDisplayPeriod.toArchive();

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.status).toBe(MovieAdministrativeStatus.ARCHIVED);
      });

      it("deve arquivar um filme quando está fora do período de exibição", () => {
        // Arrange
        const pastStartDate = createRelativeDate(-30);
        const pastEndDate = createRelativeDate(-15);

        const movieWithPastDisplayPeriod = Movie.hydrate(
          createHydrateInput({
            displayPeriod: {
              startDate: pastStartDate,
              endDate: pastEndDate,
            },
          }),
        );

        // Act
        const result = movieWithPastDisplayPeriod.toArchive();

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.status).toBe(MovieAdministrativeStatus.ARCHIVED);
      });

      it("deve falhar ao tentar arquivar um filme que está em período de exibição ativo", () => {
        // Arrange
        const startDate = createRelativeDate(-5);
        const endDate = createRelativeDate(10);

        const movieWithActiveDisplayPeriod = Movie.hydrate(
          createHydrateInput({
            displayPeriod: {
              startDate: startDate,
              endDate: endDate,
            },
          }),
        );

        // Act
        const result = movieWithActiveDisplayPeriod.toArchive();

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe(
          MovieCodes.MOVIE_CANNOT_BE_ARCHIVED,
        );
        expect(result.failures[0].details.currentStatus).toBe(
          movieWithActiveDisplayPeriod.status,
        );
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
          expect(result.failures[0].code).toBe(MovieCodes.MOVIE_ARCHIVED);
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
            MovieCodes.MOVIE_MISSING_DISPLAY_PERIOD,
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
            MovieCodes.MOVIE_NOT_AVAILABLE_IN_PERIOD,
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
            MovieCodes.MOVIE_NOT_AVAILABLE_IN_PERIOD,
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
            MovieCodes.DATE_PERIOD_IS_INVERTED,
          );
        });
      });
    });
  });
});
