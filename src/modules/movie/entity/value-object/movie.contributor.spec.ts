import { faker } from "@faker-js/faker/locale/pt_PT";
import {
  MovieContributor,
  PersonRole,
  IMovieContributorInput,
} from "./movie.contributor";
import { PersonUID } from "../../../person/value-object/person.uid";

describe("MovieContributor", () => {
  // Preparando os dados de teste usando a nova interface MovieContributorInput
  const validInput: IMovieContributorInput = {
    personUid: PersonUID.create().value,
    role: faker.helpers.arrayElement(Object.values(PersonRole)),
  };

  describe("Static Methods", () => {
    describe("create", () => {
      it("deve criar um vínculo válido", () => {
        // Act
        const result = MovieContributor.create(validInput);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.personUid.value).toBe(validInput.personUid);
        expect(result.value.role).toBe(validInput.role);
      });

      it.each([
        {
          scenario: "personUid for inválido",
          input: { ...validInput, personUid: null },
        },
        {
          scenario: "role for inválido",
          input: { ...validInput, role: undefined },
        },
      ])("deve falhar se $scenario", ({ input }) => {
        // Act
        const result = MovieContributor.create(input);

        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe("INVALID_PERSON_MOVIE_ROLE");
      });
    });

    describe("hydrate", () => {
      it("deve hidratar um vínculo corretamente", () => {
        // Act
        const hydrated = MovieContributor.hydrate(validInput);

        // Assert
        expect(hydrated.personUid.value).toBe(validInput.personUid);
        expect(hydrated.role).toBe(validInput.role);
      });

      it.each([
        {
          scenario: "personUid inválido",
          input: { ...validInput, personUid: null },
        },
        {
          scenario: "role inválido",
          input: { ...validInput, role: null },
        },
        {
          scenario: "2 parâmetros inválidos",
          input: { ...validInput, personUid: undefined, role: undefined },
        },
        {
          scenario: "objeto de entrada completamente inválido",
          input: null,
        },
      ])("deve lançar erro técnico se $scenario", ({ input }) => {
        // Assert
        expect(() => MovieContributor.hydrate(input)).toThrow("INVALID_PARAMS");
      });
    });
  });
});
