import { faker } from '@faker-js/faker'
import { ICreateMovieInput, IMovieHydrateInput, Movie } from './movie'
import { AgeRatingEnum } from './value-object/age.rating'
import { Genre } from './value-object/movie.genre'
import { PersonRole } from './value-object/movie.contributor'
import { PersonUID } from '../../person/entity/value-object/person.uid'
import { MovieAdministrativeStatusEnum } from '../type/movie.administrative.status'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { ImageUID } from '@/modules/image/entity/value-object/image.uid'
import { CreateTestMovie, createTestMovieHydrateInputDTO } from '@test/builder/movie.builder'
import { CreateTestContributorInput } from '@test/builder/contributor.builder'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'
import { DateHelper } from '@shared/helper/date.helper'

describe('Movie', () => {
  describe('Static Methods', () => {
    describe('create', () => {
      let validInput: ICreateMovieInput

      beforeEach(() => {
        validInput = {
          title: [
            { language: 'pt', text: 'Título do Filme' },
            { language: 'en', text: 'Title for movie' },
          ],
          description: [
            { language: 'pt', text: faker.string.alphanumeric({ length: { min: 48, max: 240 } }) },
            { language: 'en', text: faker.string.alphanumeric({ length: { min: 48, max: 240 } }) },
          ],
          ageRating: '12',
          imageUID: ImageUID.create().value,
          contributors: [{ personUID: PersonUID.create().value, role: 'DIRECTOR' }],
          durationInMinutes: 120,
        }
      })

      it('deve criar um filme válido com valores mínimos', () => {
        // Act
        expect(Movie.create(validInput)).toBeValidResultMatching<Movie>((m) => {
          expect(m.uid).toBeDefined()
          expect(m.status).toBe(MovieAdministrativeStatusEnum.DRAFT)
          expect(m.genre).toBeNull()
          expect(m.contributors.count).toBe(1)
          expect(m.contributors.getDirectors()[0].personUID.value).toEqual(validInput.contributors[0].personUID)
          expect(m.displayPeriod).toBeNull()
          expect(m.duration?.minutes).toBe(validInput.durationInMinutes)
        })
      })

      describe('deve falhar quando os dados de entrada são inválidos', () => {
        const testCases = [
          {
            scenario: 'título for inválido',
            input: { ...validInput, title: [] as Array<any> },
          },
          {
            scenario: 'descrição for inválida',
            input: { ...validInput, description: [] },
          },
          {
            scenario: 'classificação etária for inválida',
            input: {
              ...validInput,
              ageRating: 'INVALID' as AgeRatingEnum,
            },
          },
          {
            scenario: 'não houver imageUID',
            input: { ...validInput, imageUID: null as unknown as string },
          },
          {
            scenario: 'duração inválido',
            input: { ...validInput, durationInMinutes: -10 },
          },
        ]

        testCases.forEach(({ scenario, input }) => {
          it(scenario, () => {
            // Act
            const result = Movie.create(input)
            expect(result).toBeInvalidResult()
          })
        })
      })
    })

    describe('hydrate', () => {
      it('deve hidratar um filme corretamente', () => {
        // Arrange
        const datas = createTestMovieHydrateInputDTO()

        // Act
        const movie = Movie.hydrate(datas)

        // Assert
        expect(movie).toBeInstanceOf(Movie)
        expect(movie.uid.value).toBe(datas.uid)
        expect(movie.imageUID.value).toBe(datas.imageUID)
        expect(movie.status).toBe(datas.status)
        expect(movie.duration?.minutes).toBe(datas.duration)
        expect(movie.genre?.getGenres()).toEqual(datas.genres)
        expect(movie.displayPeriod?.startDate).toEqual(datas.displayPeriod?.startDate)
        expect(movie.displayPeriod?.endDate).toEqual(datas.displayPeriod?.endDate)
        expect(movie.contributors.count).toBe(datas.contributors.length)
        expect(movie.contributors.getAll().map((c) => c.personUID.value)).toEqual(
          datas.contributors.map((c) => c.personUID)
        )
        expect(movie.ageRating.value).toBe(datas.ageRating)
        expect(movie.title.content(SupportedLanguageEnum.PT)).toBe(datas.title.text)
        expect(movie.description.content(SupportedLanguageEnum.PT)).toBe(datas.description.text)
      })

      it('deve lançar erro técnico quando objeto parâmetro for inválido', () => {
        // Assert
        expect(() => Movie.hydrate(null as any)).toThrow()
      })

      describe('deve lançar erro quando algum valor estritamente necessário for inválido', () => {
        const nullCases = [
          { scenario: 'uid é nulo', input: createTestMovieHydrateInputDTO({ uid: null as unknown as string }) },
          { scenario: 'title é nulo', input: createTestMovieHydrateInputDTO({ title: null as any }) },
          { scenario: 'description é nulo', input: createTestMovieHydrateInputDTO({ description: null as any }) },
          {
            scenario: 'duration é nulo',
            input: createTestMovieHydrateInputDTO({ duration: null as unknown as number }),
          },
          {
            scenario: 'age rating é nulo',
            input: createTestMovieHydrateInputDTO({ ageRating: null as unknown as string }),
          },
          { scenario: 'status é nulo', input: createTestMovieHydrateInputDTO({ status: null as any }) },
          {
            scenario: 'imageUID é nulo',
            input: createTestMovieHydrateInputDTO({ imageUID: null as unknown as string }),
          },
          { scenario: 'contributors é nulo', input: createTestMovieHydrateInputDTO({ contributors: null as any }) },
        ]

        nullCases.forEach(({ scenario, input }) => {
          it(scenario, () => {
            // Act
            expect(() => Movie.hydrate(input as unknown as IMovieHydrateInput)).toThrowTechnicalError()
          })
        })
      })
    })
  })

  describe('Instance Methods', () => {
    let movie: Movie

    function expectOnlyPropertyUpdated(original: Movie, updated: Movie, propertyName: string) {
      expect(updated.uid).toEqual(original.uid)

      if (propertyName !== 'title') expect(updated.title).toEqual(original.title)
      if (propertyName !== 'description') expect(updated.description).toEqual(original.description)
      if (propertyName !== 'duration') expect(updated.duration).toEqual(original.duration)
      if (propertyName !== 'ageRating') expect(updated.ageRating).toEqual(original.ageRating)
      if (propertyName !== 'genre') expect(updated.genre).toEqual(original.genre)
      if (propertyName !== 'imageUID') expect(updated.imageUID).toEqual(original.imageUID)
      if (propertyName !== 'displayPeriod') expect(updated.displayPeriod).toEqual(original.displayPeriod)
      if (propertyName !== 'contributors') expect(updated.contributors).toEqual(original.contributors)
      if (propertyName !== 'status') expect(updated.status).toEqual(original.status)
    }

    beforeEach(() => {
      movie = CreateTestMovie({
        contributors: [
          CreateTestContributorInput(),
          CreateTestContributorInput(),
          CreateTestContributorInput(PersonRole.DIRECTOR),
        ],
      })
    })

    describe('updateTitle', () => {
      it('deve atualizar o título com sucesso', () => {
        // Arrange
        const newTitle = [
          { language: SupportedLanguageEnum.PT, text: 'Novo Título' },
          { language: SupportedLanguageEnum.EN, text: 'New Títle' },
        ]

        // Act
        const result = movie.updateTitle(newTitle)

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.title.content(SupportedLanguageEnum.PT)).toBe(newTitle[0].text)
          expectOnlyPropertyUpdated(movie, m, 'title')
        })
      })

      it('deve falhar ao atualizar com título inválido', () => {
        // Act
        const result = movie.updateTitle([])

        // Assert
        expect(result.isInvalid()).toBe(true)
      })
    })

    describe('updateDescription', () => {
      it('deve atualizar a descrição com sucesso', () => {
        // Arrange
        const newDescription = [
          { language: SupportedLanguageEnum.PT, text: faker.string.alphanumeric({ length: { min: 48, max: 240 } }) },
          { language: SupportedLanguageEnum.EN, text: faker.string.alphanumeric({ length: { min: 48, max: 240 } }) },
        ]

        // Act
        const result = movie.updateDescription(newDescription)

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.description.content(SupportedLanguageEnum.PT)).toBe(newDescription[0].text)
          expectOnlyPropertyUpdated(movie, m, 'description')
        })
      })

      it('deve falhar ao atualizar com descrição inválida', () => {
        // Act
        const result = movie.updateDescription([])

        // Assert
        expect(result.isInvalid()).toBe(true)
      })
    })

    describe('updateContributors', () => {
      it('deve atualizar os contribuidores com sucesso', () => {
        // Arrange
        const newContributors = [
          { personUID: PersonUID.create().value, role: PersonRole.DIRECTOR },
          { personUID: PersonUID.create().value, role: PersonRole.ACTOR },
        ]

        // Act
        const result = movie.updateContributors(newContributors)

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.contributors.count).toBe(newContributors.length)
          expect(m.contributors.getAll().some((c) => c.personUID.value === newContributors[0].personUID)).toBe(true)
          expect(m.contributors.getAll().some((c) => c.personUID.value === newContributors[1].personUID)).toBe(true)
          expectOnlyPropertyUpdated(movie, m, 'contributors')
        })
      })

      it('deve falhar se dados inválidos forem fornecidos', () => {
        // Act
        const result = movie.updateContributors(null as any)

        // Assert
        expect(result.isInvalid()).toBe(true)
      })

      it('deve falhar ao remover o único diretor', () => {
        // Arrange
        const movieWithOnlyDirector = CreateTestMovie({
          contributors: [
            {
              personUID: PersonUID.create().value,
              role: PersonRole.DIRECTOR,
            },
          ],
        })

        // Act
        const result = movieWithOnlyDirector.updateContributors([])

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MOVIE_MISSING_CONTRIBUTORS)
      })
    })

    describe('setDuration', () => {
      it('deve definir duração com sucesso', () => {
        // Arrange
        const newDuration = 150

        // Act
        const result = movie.setDuration(newDuration)

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.duration?.minutes).toBe(newDuration)
          expectOnlyPropertyUpdated(movie, m, 'duration')
        })
      })

      it('deve falhar ao definir duração negativa', () => {
        // Act
        const result = movie.setDuration(-10)

        // Assert
        expect(result.isInvalid()).toBe(true)
      })
    })

    describe('updateAgeRating', () => {
      it('deve atualizar a classificação etária com sucesso', () => {
        // Act
        const result = movie.updateAgeRating(AgeRatingEnum.TEN)

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.ageRating.value).toBe('10')
          expectOnlyPropertyUpdated(movie, m, 'ageRating')
        })
      })

      it('deve falhar com classificação etária inválida', () => {
        // Act
        const result = movie.updateAgeRating('INVALID' as AgeRatingEnum)

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.INVALID_ENUM_VALUE)
      })
    })

    describe('setGenres', () => {
      it('deve definir gêneros com sucesso', () => {
        // Act
        const result = movie.setGenres([Genre.ACTION, Genre.COMEDY])

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.genre?.getGenres().some((g) => g === Genre.ACTION)).toBe(true)
          expect(m.genre?.getGenres().some((g) => g === Genre.COMEDY)).toBe(true)
          expectOnlyPropertyUpdated(movie, m, 'genre')
        })
      })

      it('deve falhar com lista de gêneros vazia', () => {
        // Act
        const result = movie.setGenres([])

        // Assert
        expect(result.isInvalid()).toBe(true)
      })
    })

    describe('updatePosterImage', () => {
      it('deve atualizar a imagem do poster com sucesso', () => {
        // Arrange
        const newImageUID = ImageUID.create().value

        // Act
        const result = movie.updatePosterImage(newImageUID)

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.imageUID.value).toBe(newImageUID)
          expectOnlyPropertyUpdated(movie, m, 'imageUID')
        })
      })

      it('deve falhar com imageUID inválido', () => {
        // Act
        const result = movie.updatePosterImage('')

        // Assert
        expect(result.isInvalid()).toBe(true)
      })
    })

    describe('setDisplayPeriod', () => {
      it('deve definir período de exibição com sucesso', () => {
        // Arrange
        const startDate = DateHelper.soon(1)
        const endDate = DateHelper.soon(30)

        // Act
        const result = movie.setDisplayPeriod(startDate, endDate)

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.displayPeriod?.startDate).toEqual(startDate)
          expect(m.displayPeriod?.endDate).toEqual(endDate)
          expectOnlyPropertyUpdated(movie, m, 'displayPeriod')
        })
      })

      it('deve falhar com data de início posterior à data de fim', () => {
        // Arrange
        const startDate = faker.date.soon({ days: 5 })
        const endDate = faker.date.soon({ days: 2 })

        // Act
        const result = movie.setDisplayPeriod(startDate, endDate)

        // Assert
        expect(result.isInvalid()).toBe(true)
      })
    })

    describe('toPendingReview', () => {
      it('deve mudar para pendente de revisão quando todos requisitos são atendidos', () => {
        // Act
        const result = movie.toPendingReview()

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.status).toBe(MovieAdministrativeStatusEnum.PENDING_REVIEW)
          expectOnlyPropertyUpdated(movie, m, 'status')
        })
      })

      it('deve falhar ao tentar mudar para pendente quando não houver um diretor associado ao filme', () => {
        // Arrange
        const movieWithoutDirector = CreateTestMovie({
          contributors: [
            {
              personUID: PersonUID.create().value,
              role: PersonRole.ACTOR,
            },
          ],
        })

        // Act
        const result = movieWithoutDirector.toPendingReview()

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MOVIE_DIRECTOR_REQUIRED)
      })

      it('deve falhar se o filme já estiver em APPROVED', () => {
        // Arrange
        const movieApproved = CreateTestMovie({
          status: MovieAdministrativeStatusEnum.APPROVED,
          contributors: [CreateTestContributorInput(PersonRole.DIRECTOR)],
        })

        // Act
        const result = movieApproved.toPendingReview()

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MOVIE_ALREADY_APPROVED)
      })

      it('deve falhar se o filme já estiver em ARCHIVED', () => {
        // Arrange
        const movieArchived = CreateTestMovie({
          status: MovieAdministrativeStatusEnum.ARCHIVED,
        })

        // Act
        const result = movieArchived.toPendingReview()

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MOVIE_IS_ARCHIVED)
      })

      it('deve manter o mesmo status se já estiver em PENDING_REVIEW', () => {
        // Arrange
        const moviePending = CreateTestMovie({
          status: MovieAdministrativeStatusEnum.PENDING_REVIEW,
        })

        // Act
        const result = moviePending.toPendingReview()

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.status).toBe(MovieAdministrativeStatusEnum.PENDING_REVIEW)
        })
      })
    })

    describe('toApprove', () => {
      it('deve aprovar um filme quando todos os requisitos são atendidos', () => {
        // Arrange
        const moviePending = CreateTestMovie({
          status: MovieAdministrativeStatusEnum.PENDING_REVIEW,
          duration: 120,
          genres: [Genre.ACTION],
        })

        // Act
        const result = moviePending.toApprove()

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.status).toBe(MovieAdministrativeStatusEnum.APPROVED)
          expectOnlyPropertyUpdated(moviePending, m, 'status')
        })
      })

      it('deve falhar quando o filme já possui o status "APPROVED"', () => {
        // Arrange
        const approvedMovie = CreateTestMovie({
          status: MovieAdministrativeStatusEnum.APPROVED,
          duration: 120,
          genres: [Genre.ACTION],
        })

        // Act
        const result = approvedMovie.toApprove()

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MOVIE_ALREADY_APPROVED)
      })

      it('deve falhar quando não está em PENDING_REVIEW', () => {
        // Act (movie está em DRAFT por padrão)
        const result = movie.toApprove()

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MOVIE_NOT_IN_DRAFT)
      })

      it('deve falhar ao tentar aprovar sem gêneros definidos', () => {
        // Arrange
        const moviePending = CreateTestMovie({
          status: MovieAdministrativeStatusEnum.PENDING_REVIEW,
          duration: 120,
          genres: [],
        })

        // Act
        const result = moviePending.toApprove()

        // Assert
        expect(result.isInvalid()).toBe(true)
      })

      it('deve falhar quando não tem um diretor definido', () => {
        // Arrange
        const moviePending = CreateTestMovie({
          status: MovieAdministrativeStatusEnum.PENDING_REVIEW,
          duration: 120,
          genres: [Genre.ACTION],
          contributors: [{ personUID: PersonUID.create().value, role: PersonRole.ACTOR }],
        })

        // Act
        const result = moviePending.toApprove()

        // Assert
        expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MOVIE_DIRECTOR_REQUIRED)
      })
    })

    describe('toArchive', () => {
      it('deve arquivar um filme aprovado com sucesso', () => {
        // Arrange
        const approvedMovie = CreateTestMovie({
          status: MovieAdministrativeStatusEnum.APPROVED,
        })

        // Act
        const result = approvedMovie.toArchive()

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.status).toBe(MovieAdministrativeStatusEnum.ARCHIVED)
          expectOnlyPropertyUpdated(approvedMovie, m, 'status')
        })
      })

      it('deve arquivar um filme com status em DRAFT com sucesso', () => {
        // Act (está em draft por d=adrão)
        const result = movie.toArchive()

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.status).toBe(MovieAdministrativeStatusEnum.ARCHIVED)
          expectOnlyPropertyUpdated(movie, m, 'status')
        })
      })

      it('deve arquivar com sucesso um filme com status igual à PENDING_REVIEW', () => {
        // Arrange
        const pendingMovie = CreateTestMovie({
          status: MovieAdministrativeStatusEnum.PENDING_REVIEW,
        })

        // Act
        const result = pendingMovie.toArchive()

        // Assert
        expect(result).toBeDefined()
      })

      it('deve manter o mesmo status se já estiver arquivado', () => {
        // Arrange
        const archivedMovie = CreateTestMovie({
          status: MovieAdministrativeStatusEnum.ARCHIVED,
        })

        // Act
        const result = archivedMovie.toArchive()

        // Assert
        expect(result).toBeValidResultMatching<Movie>((m) => {
          expect(m.status).toBe(MovieAdministrativeStatusEnum.ARCHIVED)
        })
      })
    })

    describe('isAvailableForPeriod', () => {
      const setupAvailabilityTest = () => {
        const now = new Date()
        const startDate = new Date(now)
        const endDate = new Date(now)
        endDate.setDate(endDate.getDate() + 10)

        const movie = CreateTestMovie({
          displayPeriod: { startDate, endDate },
          status: MovieAdministrativeStatusEnum.APPROVED,
        })

        return { now, startDate, endDate, movie }
      }

      it('deve aceitar data proposta dentro do período de exibição', () => {
        // Arrange
        const { movie } = setupAvailabilityTest()
        const proposedDate = faker.date.soon({ days: 5 })

        // Act
        const result = movie.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(true)
      })

      it('deve aceitar data proposta no primeiro dia do período de exibição', () => {
        // Arrange
        const { startDate, movie } = setupAvailabilityTest()
        const proposedDate = new Date(startDate)

        // Act
        const result = movie.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(true)
      })

      it('deve aceitar data proposta no último dia do período de exibição', () => {
        // Arrange
        const { endDate, movie } = setupAvailabilityTest()
        const proposedDate = new Date(endDate)

        // Act
        const result = movie.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(true)
      })

      it('deve aceitar data proposta no último dia do período mesmo com horário após 23:59', () => {
        // Arrange
        const { endDate, movie } = setupAvailabilityTest()
        const proposedDate = new Date(endDate)
        proposedDate.setHours(23, 59, 59, 999)

        // Act
        const result = movie.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(true)
      })

      it('deve rejeitar data proposta antes do período de exibição', () => {
        // Arrange
        const { movie } = setupAvailabilityTest()
        const proposedDate = faker.date.recent({ days: 15 })

        // Act
        const result = movie.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(false)
      })

      it('deve rejeitar data proposta após o período de exibição', () => {
        // Arrange
        const { movie } = setupAvailabilityTest()
        const proposedDate = DateHelper.soon(15)

        // Act
        const result = movie.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(false)
      })

      it('deve rejeitar quando o filme não tem período de exibição definido', () => {
        // Arrange
        const movieWithoutPeriod = CreateTestMovie({
          displayPeriod: null as any,
          status: MovieAdministrativeStatusEnum.APPROVED,
        })

        const proposedDate = new Date()

        // Act
        const result = movieWithoutPeriod.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(false)
      })

      it('deve rejeitar quando o filme não está aprovado', () => {
        // Arrange
        const { startDate, endDate } = setupAvailabilityTest()
        const movieNotApproved = CreateTestMovie({
          displayPeriod: { startDate, endDate },
          status: MovieAdministrativeStatusEnum.DRAFT,
        })

        const proposedDate = new Date(startDate)

        // Act
        const result = movieNotApproved.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(false)
      })

      it('deve rejeitar quando o filme está arquivado', () => {
        // Arrange
        const { startDate, endDate } = setupAvailabilityTest()
        const archivedMovie = CreateTestMovie({
          displayPeriod: { startDate, endDate },
          status: MovieAdministrativeStatusEnum.ARCHIVED,
        })

        const proposedDate = new Date(startDate)

        // Act
        const result = archivedMovie.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(false)
      })

      it('deve rejeitar quando o filme está pendente de revisão', () => {
        // Arrange
        const { startDate, endDate } = setupAvailabilityTest()
        const pendingMovie = CreateTestMovie({
          displayPeriod: { startDate, endDate },
          status: MovieAdministrativeStatusEnum.PENDING_REVIEW,
        })

        const proposedDate = new Date(startDate)

        // Act
        const result = pendingMovie.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(false)
      })
    })

    describe('hasMinimumRequirementsForReview', () => {
      it('deve retornar true quando tem todos os requisitos mínimos', () => {
        // Act
        const result = movie.hasMinimumRequirementsForReview()

        // Assert
        expect(result).toBe(true)
      })

      it('deve retornar false quando não tem diretor', () => {
        // Arrange
        const movieWithoutDirector = CreateTestMovie({
          contributors: [{ personUID: PersonUID.create().value, role: PersonRole.ACTOR }],
        })

        // Act
        const result = movieWithoutDirector.hasMinimumRequirementsForReview()

        // Assert
        expect(result).toBe(false)
      })

      it('deve retornar false quando não tem contribuidores', () => {
        // Arrange
        const movieWithoutContributors = CreateTestMovie({
          contributors: [],
        })

        // Act
        const result = movieWithoutContributors.hasMinimumRequirementsForReview()

        // Assert
        expect(result).toBe(false)
      })
    })

    describe('hasAllRequirementsForApproval', () => {
      it('deve retornar true quando tem todos os requisitos para aprovação', () => {
        // Arrange
        const completeMovie = CreateTestMovie({ status: MovieAdministrativeStatusEnum.PENDING_REVIEW })

        // Act
        const result = completeMovie.hasAllRequirementsForApproval()

        // Assert
        expect(result).toBe(true)
      })

      it('deve retornar false quando não tem gêneros', () => {
        // Arrange
        const movieWithoutGenres = CreateTestMovie({
          duration: 120,
          genres: [],
        })

        // Act
        const result = movieWithoutGenres.hasAllRequirementsForApproval()

        // Assert
        expect(result).toBe(false)
      })

      it('deve retornar false quando não tem diretor', () => {
        // Arrange
        const movieWithoutDirector = CreateTestMovie({
          duration: 120,
          genres: [Genre.ACTION],
          contributors: [{ personUID: PersonUID.create().value, role: PersonRole.ACTOR }],
        })

        // Act
        const result = movieWithoutDirector.hasAllRequirementsForApproval()

        // Assert
        expect(result).toBe(false)
      })

      it('deve retornar false quando não atende aos requisitos mínimos para revisão', () => {
        // Arrange
        const incompleteMovie = CreateTestMovie({
          duration: 120,
          genres: [Genre.ACTION],
          contributors: [], // Sem contribuidores
        })

        // Act
        const result = incompleteMovie.hasAllRequirementsForApproval()

        // Assert
        expect(result).toBe(false)
      })
    })
  })
})
