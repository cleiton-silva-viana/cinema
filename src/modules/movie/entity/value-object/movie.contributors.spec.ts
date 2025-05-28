import { MovieContributors } from './movie.contributors'
import { IMovieContributorInput, MovieContributor, PersonRole } from './movie.contributor'
import { PersonUID } from '@modules/person/entity/value-object/person.uid'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { validateAndCollect } from '@shared/validator/common.validators'
import { SimpleFailure } from '@shared/failure/simple.failure.type'

describe('MovieContributors', () => {
  const createValidContributor = (role: PersonRole = PersonRole.ACTOR): IMovieContributorInput => ({
    personUID: PersonUID.create().value,
    role: role,
  })

  const createValidContributors = (): IMovieContributorInput[] => {
    return [
      createValidContributor(PersonRole.DIRECTOR),
      createValidContributor(PersonRole.ACTOR),
      createValidContributor(PersonRole.ACTRESS),
    ]
  }

  describe('Static Methods', () => {
    describe('create', () => {
      let failures: SimpleFailure[]

      beforeEach(() => (failures = []))

      it('deve criar uma coleção válida de contribuidores', () => {
        // Arrange
        const validContributors = createValidContributors()

        // Act
        const result = validateAndCollect(MovieContributors.create(validContributors), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.count).toBe(validContributors.length)
        expect(result.roles).toContain(PersonRole.DIRECTOR)
        expect(result.roles).toContain(PersonRole.ACTOR)
        expect(result.roles).toContain(PersonRole.ACTRESS)
      })

      it('deve aceitar instâncias de MovieContributor', () => {
        // Arrange
        const validInput = createValidContributor(PersonRole.DIRECTOR)
        const contributor = MovieContributor.hydrate(validInput)

        // Act
        const result = validateAndCollect(MovieContributors.create([contributor]), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.count).toBe(1)
      })

      it('deve falhar se não houver contribuidores', () => {
        // Act
        const result = validateAndCollect(MovieContributors.create([]), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MOVIE_MISSING_CONTRIBUTORS)
      })

      it('deve falhar se a entrada for null', () => {
        // Act
        const result = validateAndCollect(MovieContributors.create(null as any), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MOVIE_MISSING_CONTRIBUTORS)
      })

      it('deve falhar se não houver diretor', () => {
        // Arrange
        const contributorsWithoutDirector = [
          createValidContributor(PersonRole.ACTOR),
          createValidContributor(PersonRole.ACTRESS),
        ]

        // Act
        const result = validateAndCollect(MovieContributors.create(contributorsWithoutDirector), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MOVIE_DIRECTOR_REQUIRED)
      })

      it('deve falhar se algum contribuidor for inválido', () => {
        // Arrange
        const invalidContributor: IMovieContributorInput = {
          personUID: null as any,
          role: PersonRole.DIRECTOR,
        }

        // Act
        const result = validateAndCollect(MovieContributors.create([invalidContributor]), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
      })
    })

    describe('hydrate', () => {
      it('deve hidratar uma coleção de contribuidores corretamente', () => {
        // Arrange
        const validContributors = createValidContributors()

        // Act
        const hydrated = MovieContributors.hydrate(validContributors)

        // Assert
        expect(hydrated.count).toBe(validContributors.length)
        expect(hydrated.roles).toContain(PersonRole.DIRECTOR)
        expect(hydrated.roles).toContain(PersonRole.ACTOR)
        expect(hydrated.roles).toContain(PersonRole.ACTRESS)
      })

      it('deve lançar erro técnico se a entrada for null', () => {
        // Assert
        expect(() => MovieContributors.hydrate(null as any)).toThrow(FailureCode.MISSING_REQUIRED_DATA)
      })
    })
  })

  describe('Instance Methods', () => {
    let contributors: MovieContributors

    beforeEach(() => {
      const validContributors = createValidContributors()
      contributors = MovieContributors.hydrate(validContributors)
    })

    describe('getAll', () => {
      it('deve retornar todos os contribuidores', () => {
        // Act
        const allContributors = contributors.getAll()

        // Assert
        expect(allContributors.length).toBe(3)
      })
    })

    describe('getDirectors', () => {
      it('deve retornar apenas os diretores', () => {
        // Act
        const directors = contributors.getDirectors()

        // Assert
        expect(directors.length).toBe(1)
        expect(directors[0].role).toBe(PersonRole.DIRECTOR)
      })

      it('deve retornar array vazio quando não houver diretores', () => {
        // Arrange
        const contributorsWithoutDirector = MovieContributors.hydrate([createValidContributor(PersonRole.ACTOR)])

        // Act
        const directors = contributorsWithoutDirector.getDirectors()

        // Assert
        expect(directors).toEqual([])
      })
    })

    describe('getActors', () => {
      it('deve retornar atores e atrizes', () => {
        // Act
        const actors = contributors.getActors()

        // Assert
        expect(actors.length).toBe(2)
        expect(actors.some((a) => a.role === PersonRole.ACTOR)).toBe(true)
        expect(actors.some((a) => a.role === PersonRole.ACTRESS)).toBe(true)
      })

      it('deve retornar array vazio quando não houver atores ou atrizes', () => {
        // Arrange
        const contributorsWithoutActors = MovieContributors.hydrate([createValidContributor(PersonRole.DIRECTOR)])

        // Act
        const actors = contributorsWithoutActors.getActors()

        // Assert
        expect(actors).toEqual([])
      })
    })

    describe('getByRole', () => {
      it('deve retornar contribuidores com papel específico', () => {
        // Act
        const actresses = contributors.getByRole(PersonRole.ACTRESS)

        // Assert
        expect(actresses.length).toBe(1)
        expect(actresses[0].role).toBe(PersonRole.ACTRESS)
      })

      it('deve retornar array vazio para papel inexistente', () => {
        // Act
        const writers = contributors.getByRole(PersonRole.WRITER)

        // Assert
        expect(writers).toEqual([])
      })

      it('deve retornar array vazio quando não houver contribuidores do papel especificado', () => {
        // Arrange
        const contributorsWithoutActress = MovieContributors.hydrate([
          createValidContributor(PersonRole.DIRECTOR),
          createValidContributor(PersonRole.ACTOR),
        ])

        // Act
        const actresses = contributorsWithoutActress.getByRole(PersonRole.ACTRESS)

        // Assert
        expect(actresses).toEqual([])
      })
    })

    describe('count', () => {
      it('deve retornar a quantidade total de contribuidores', () => {
        // Assert
        expect(contributors.count).toBe(3)
      })
    })

    describe('roles', () => {
      it('deve retornar todos os papéis presentes na coleção', () => {
        // Act
        const roles = contributors.roles

        // Assert
        expect(roles.length).toBe(3)
        expect(roles).toContain(PersonRole.DIRECTOR)
        expect(roles).toContain(PersonRole.ACTOR)
        expect(roles).toContain(PersonRole.ACTRESS)
      })

      it('deve retornar apenas os papéis existentes na coleção', () => {
        // Arrange
        const limitedContributors = MovieContributors.hydrate([createValidContributor(PersonRole.DIRECTOR)])

        // Act
        const roles = limitedContributors.roles

        // Assert
        expect(roles.length).toBe(1)
        expect(roles).toContain(PersonRole.DIRECTOR)
        expect(roles).not.toContain(PersonRole.ACTOR)
        expect(roles).not.toContain(PersonRole.ACTRESS)
      })
    })
  })
})
