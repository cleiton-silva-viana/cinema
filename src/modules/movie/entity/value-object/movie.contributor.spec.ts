import { faker } from '@faker-js/faker/locale/pt_PT'
import { IMovieContributorInput, MovieContributor, PersonRole } from './movie.contributor'
import { PersonUID } from '@modules/person/entity/value-object/person.uid'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { validateAndCollect } from '@shared/validator/common.validators'

describe('MovieContributor', () => {
  const VALID_INPUT: IMovieContributorInput = {
    personUID: PersonUID.create().value,
    role: faker.helpers.arrayElement(Object.values(PersonRole)),
  }

  describe('Static Methods', () => {
    describe('create', () => {
      let failures: SimpleFailure[]

      beforeEach(() => (failures = []))

      it('deve criar um vínculo válido', () => {
        // Act
        const result = validateAndCollect(MovieContributor.create(VALID_INPUT), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.personUID.value).toBe(VALID_INPUT.personUID)
        expect(result.role).toBe(VALID_INPUT.role)
      })

      describe('deve falhar', () => {
        it('se person uid for nulo', () => {
          // Arrange
          const input = {
            ...VALID_INPUT,
            personUID: null as unknown as string,
          }

          // Act
          const result = validateAndCollect(MovieContributor.create(input), failures)

          // Assert
          expect(result).toBeNull()
          expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
        })

        it(`se role for um valor inválido`, () => {
          // Arrange
          const input = { ...VALID_INPUT, role: undefined as any }

          // Act
          const result = validateAndCollect(MovieContributor.create(input), failures)

          // Assert
          expect(result).toBeNull()
          expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE)
        })
      })
    })

    describe('hydrate', () => {
      it('deve hidratar um vínculo corretamente', () => {
        // Act
        const hydrated = MovieContributor.hydrate(VALID_INPUT)

        // Assert
        expect(hydrated.personUID.value).toBe(VALID_INPUT.personUID)
        expect(hydrated.role).toBe(VALID_INPUT.role)
      })

      describe('deve lançar erro técnico', () => {
        const cases = [
          {
            scenario: 'personUid inválido',
            input: { ...VALID_INPUT, personUID: null as unknown as string },
          },
          {
            scenario: 'role inválido',
            input: { ...VALID_INPUT, role: null },
          },
          {
            scenario: '2 parâmetros inválidos',
            input: { ...VALID_INPUT, personUid: undefined, role: undefined },
          },
          {
            scenario: 'objeto de entrada completamente inválido',
            input: null,
          },
        ]
        cases.forEach(({ scenario, input }) => {
          it(`se ${scenario}`, () => {
            expect(() => MovieContributor.hydrate(input as IMovieContributorInput)).toThrow(
              FailureCode.MISSING_REQUIRED_DATA
            )
          })
        })
      })
    })
  })
})
