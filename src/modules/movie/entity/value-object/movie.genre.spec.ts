import { MovieGenre, Genre, GenreCodes } from "./movie.genre";
import { SupportedLanguage } from "../../../../shared/value-object/multilingual-content";

describe("MovieGenre", () => {
  const validGenres: Genre[] = [Genre.ACTION, Genre.COMEDY];
  const validGenreStrings: string[] = ["ACTION", "COMEDY"];
  const tooManyGenres = [
    Genre.ACTION,
    Genre.COMEDY,
    Genre.DRAMA,
    Genre.FANTASY,
    Genre.HORROR,
    Genre.ROMANCE,
  ];
  const invalidGenreString = "INVALID_GENRE";
  const duplicatedGenres = [Genre.ACTION, Genre.ACTION];
  const duplicatedGenreStrings = ["ACTION", "action"];

  describe("Static Methods", () => {
    describe("create", () => {
      describe("deve retornar uma instância de MovieGenre com sucesso", () => {
        const successCases = [
          {
            genres: validGenres,
            scenario: "com gêneros válidos usando enum",
          },
          {
            genres: validGenreStrings,
            scenario: "com gêneros válidos usando strings",
          },
          {
            genres: [Genre.ACTION],
            scenario: "com o número mínimo de gêneros",
          },
          {
            genres: [
              Genre.ACTION,
              Genre.COMEDY,
              Genre.DRAMA,
              Genre.FANTASY,
              Genre.HORROR,
            ],
            scenario: "com o número máximo de gêneros",
          },
        ];

        successCases.forEach(({ genres, scenario }) => {
          it(`deve aceitar gêneros ${scenario}`, () => {
            // Act
            const result = MovieGenre.create(genres);

            // Assert
            expect(result.invalid).toBe(false);
            expect(result.value).toBeInstanceOf(MovieGenre);
          });
        });
      });

      describe("deve retornar um erro quando os gêneros são inválidos", () => {
        const failureCases = [
          {
            genres: null as any,
            scenario: "quando os gêneros são nulos",
            errorCode: GenreCodes.INVALID_GENRE_COUNT,
          },
          {
            genres: undefined as any,
            scenario: "quando os gêneros são indefinidos",
            errorCode: GenreCodes.INVALID_GENRE_COUNT,
          },
          {
            genres: [],
            scenario: "quando o array de gêneros está vazio",
            errorCode: GenreCodes.INVALID_GENRE_COUNT,
          },
          {
            genres: tooManyGenres,
            scenario: "quando há mais que o número máximo de gêneros",
            errorCode: GenreCodes.INVALID_GENRE_COUNT,
          },
          {
            genres: duplicatedGenres,
            scenario: "quando há gêneros duplicados usando enum",
            errorCode: GenreCodes.DUPLICATE_GENRES,
          },
          {
            genres: duplicatedGenreStrings,
            scenario: "quando há gêneros duplicados usando strings",
            errorCode: GenreCodes.DUPLICATE_GENRES,
          },
          {
            genres: [invalidGenreString],
            scenario: "quando contém um gênero inválido",
            errorCode: GenreCodes.INVALID_GENRE,
          },
        ];

        failureCases.forEach(({ genres, scenario, errorCode }) => {
          it(`deve rejeitar gêneros ${scenario}`, () => {
            // Act
            const result = MovieGenre.create(genres);

            // Assert
            expect(result.invalid).toBe(true);
            expect(result.failures[0].code).toBe(errorCode);
          });
        });
      });
    });

    describe("hydrate", () => {
      it("deve criar uma instância de MovieGenre a partir de strings", () => {
        // Arrange
        const genreStrings = ["ACTION", "COMEDY"];

        // Act
        const movieGenre = MovieGenre.hydrate(genreStrings);

        // Assert
        expect(movieGenre.getGenres()).toEqual([Genre.ACTION, Genre.COMEDY]);
      });

      it("deve aceitar strings de gêneros que normalmente seriam inválidos em quantidade", () => {
        // Arrange - Mais gêneros do que o permitido
        const tooManyGenreStrings = [
          "ACTION",
          "COMEDY",
          "DRAMA",
          "FANTASY",
          "HORROR",
          "ROMANCE",
        ];

        // Act
        const movieGenre = MovieGenre.hydrate(tooManyGenreStrings);

        // Assert
        expect(movieGenre.count).toBe(6); // Mais do que o MAX_GENRES
      });

      it("deve aceitar strings de gêneros duplicados", () => {
        // Arrange
        const duplicatedGenreStrings = ["ACTION", "ACTION", "COMEDY"];

        // Act
        const movieGenre = MovieGenre.hydrate(duplicatedGenreStrings);

        // Assert
        expect(movieGenre.count).toBe(3);
        // O primeiro e o segundo elemento são iguais
        expect(movieGenre.getGenres()[0]).toBe(movieGenre.getGenres()[1]);
      });

      it("deve aceitar strings de gêneros em minúsculas", () => {
        // Arrange
        const lowerCaseGenreStrings = ["action", "comedy"];

        // Act
        const movieGenre = MovieGenre.hydrate(lowerCaseGenreStrings);

        // Assert
        expect(movieGenre.count).toEqual(lowerCaseGenreStrings.length);
        expect(movieGenre.getGenres()).toContain(
          lowerCaseGenreStrings[0].toUpperCase(),
        );
        expect(movieGenre.getGenres()).toContain(
          lowerCaseGenreStrings[1].toUpperCase(),
        );
      });

      it("deve ignorar os generos não mapeados e criar uma instância", () => {
        // Arrange
        const invalidGenre = "INVALID_GENRE";
        const unknownGenre = "UNKNOWN_GENRE";
        const unmappedGenres = [...tooManyGenres, invalidGenre, unknownGenre];

        // Act
        const movieGenre = MovieGenre.hydrate(unmappedGenres);

        // Assert
        expect(movieGenre.getGenres()).toEqual(tooManyGenres);
        expect(movieGenre.count).toBe(tooManyGenres.length);
        expect(movieGenre.count).not.toBe(invalidGenre);
        expect(movieGenre.count).not.toBe(unknownGenre);
      });

      it("deve lançar TechnicalError quando recebe array nulo", () => {
        // Arrange
        const nullArray = null as unknown as string[];

        // Act & Assert
        expect(() => {
          MovieGenre.hydrate(nullArray);
        }).toThrow();
      });

      it("deve lançar TechnicalError quando recebe array vazio", () => {
        // Arrange
        const emptyArray: string[] = [];

        // Act & Assert
        expect(() => {
          MovieGenre.hydrate(emptyArray);
        }).toThrow();
      });
    });
  });

  describe("Instance Methods", () => {
    it("getGenres deve retornar todos os generos", () => {
      // Arrange
      const result = MovieGenre.create(validGenres);

      // Act
      const genres = result.value.getGenres();

      // Assert
      expect(genres).toEqual(validGenres);
      expect(genres).not.toBe(validGenres);
    });

    it("getTranslations deve retornar as traduções no idioma especificado", () => {
      // Arrange
      const result = MovieGenre.create([Genre.ACTION, Genre.COMEDY]);

      // Act
      const ptTranslations = result.value.getTranslations(SupportedLanguage.PT);
      const enTranslations = result.value.getTranslations(SupportedLanguage.EN);

      // Assert
      expect(ptTranslations).toEqual(["Ação", "Comédia"]);
      expect(enTranslations).toEqual(["Action", "Comedy"]);
    });

    it("hasGenre deve verificar corretamente se um gênero está presente", () => {
      // Arrange
      const result = MovieGenre.create([Genre.ACTION, Genre.COMEDY]);

      // Act & Assert
      expect(result.value.hasGenre(Genre.ACTION)).toBe(true);
      expect(result.value.hasGenre(Genre.HORROR)).toBe(false);
    });

    it("count deve retornar a quantidade correta de gêneros", () => {
      // Arrange
      const result = MovieGenre.create([Genre.ACTION, Genre.COMEDY]);

      // Act & Assert
      expect(result.value.count).toBe(2);
    });
  });
});
