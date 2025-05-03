import { faker } from "@faker-js/faker/locale/pt_PT";
import {
  MovieContributor,
  PersonRole,
  IMovieContributorInput,
} from "./movie.contributor";
import { PersonUID } from "../../../person/entity/value-object/person.uid";
import { FailureCode } from "../../../../shared/failure/failure.codes.enum";

describe("MovieContributor", () => {
  const VALID_INPUT: IMovieContributorInput = {
    personUid: PersonUID.create().value,
    role: faker.helpers.arrayElement(Object.values(PersonRole)),
  };

  describe("Static Methods", () => {
    describe("create", () => {
      it("deve criar um vínculo válido", () => {
        // Act
        const result = MovieContributor.create(VALID_INPUT);

        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.personUid.value).toBe(VALID_INPUT.personUid);
        expect(result.value.role).toBe(VALID_INPUT.role);
      });

      describe("deve falhar", () => {
        it("se person uid for nulo", () => {
          // Arrange
          const input = {
            ...VALID_INPUT,
            personUid: null as unknown as string,
          };

          // Act
          const result = MovieContributor.create(input);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(FailureCode.NULL_ARGUMENT);
        });

        it(`se role for um valor inválido`, () => {
          // Arrange
          const input = { ...VALID_INPUT, role: undefined as any };

          // Act
          const result = MovieContributor.create(input);

          // Assert
          expect(result.invalid).toBe(true);
          expect(result.failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE);
        });
      });
    });

    describe("hydrate", () => {
      it("deve hidratar um vínculo corretamente", () => {
        // Act
        const hydrated = MovieContributor.hydrate(VALID_INPUT);

        // Assert
        expect(hydrated.personUid.value).toBe(VALID_INPUT.personUid);
        expect(hydrated.role).toBe(VALID_INPUT.role);
      });

      describe("deve lançar erro técnico", () => {
        const cases = [
          {
            scenario: "personUid inválido",
            input: { ...VALID_INPUT, personUid: null as unknown as string },
          },
          {
            scenario: "role inválido",
            input: { ...VALID_INPUT, role: null },
          },
          {
            scenario: "2 parâmetros inválidos",
            input: { ...VALID_INPUT, personUid: undefined, role: undefined },
          },
          {
            scenario: "objeto de entrada completamente inválido",
            input: null,
          },
        ];
        cases.forEach(({ scenario, input }) => {
          it(`se ${scenario}`, () => {
            expect(() => MovieContributor.hydrate(input)).toThrow(
              FailureCode.NULL_ARGUMENT,
            );
          });
        });
      });
    });
  });
});
