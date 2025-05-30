import { v7 } from 'uuid'
import { fa, faker } from '@faker-js/faker'
import { ICreateMovieInput, IMovieHydrateInput, Movie } from './movie'
import { MovieUID } from './value-object/movie.uid'
import { AgeRatingEnum } from './value-object/age.rating'
import { Genre } from './value-object/movie.genre'
import { PersonRole } from './value-object/movie.contributor'
import { PersonUID } from '../../person/entity/value-object/person.uid'
import { MovieAdministrativeStatus } from '../type/movie.administrative.status'
import { ILanguageContent, SupportedLanguage } from '@shared/value-object/multilingual-content'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { validateAndCollect } from '@shared/validator/common.validators'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { TechnicalError } from '@shared/error/technical.error'
import { ImageUID } from '@modules/image/entity/value-object/image.uid'

describe('Movie', () => {
  function createDate(day: number, hour: number = 12): Date {
    const now = new Date()
    return new Date(now.getTime() + day * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000)
  }

  function createHydrateInput(overrides: Partial<IMovieHydrateInput> = {}): IMovieHydrateInput {
    const defaultInput: IMovieHydrateInput = {
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
      imageUID: 'IMG.' + v7(),
      contributors: [
        {
          personUID: PersonUID.create().value,
          role: PersonRole.DIRECTOR,
        },
      ],
      displayPeriod: {
        startDate: createDate(5, 10),
        endDate: createDate(10, 15),
      },
    }

    return {
      ...defaultInput,
      ...overrides,
    }
  }
  describe('Static Methods', () => {
    describe('create', () => {
      let failures: SimpleFailure[]
      let validInput: ICreateMovieInput

      beforeEach(() => {
        failures = []

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
        const result = validateAndCollect(Movie.create(validInput), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result).toBeInstanceOf(Movie)
        expect(result.uid).toBeDefined()
        expect(result.status).toBe(MovieAdministrativeStatus.DRAFT)
        expect(result.genre).toBeNull()
        expect(result.contributors.count).toBe(1)
        expect(result.contributors.getDirectors()[0].personUID.value).toEqual(validInput.contributors[0].personUID)
        expect(result.displayPeriod).toBeNull()
        expect(result.duration?.minutes).toBe(validInput.durationInMinutes)
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

            // Assert
            expect(result.isInvalid()).toBe(true)
          })
        })
      })
    })

    describe('hydrate', () => {
      it('deve hidratar um filme corretamente', () => {
        // Arrange
        const input = createHydrateInput()

        // Act
        const movie = Movie.hydrate(input)

        // Assert
        expect(movie).toBeInstanceOf(Movie)
        expect(movie.uid.value).toBe(input.uid)
        expect(movie.status).toBe(input.status)
        expect(movie.duration?.minutes).toBe(input.duration)
        expect(movie.genre?.getGenres()).toEqual(input.genres)
        expect(movie.imageUID.value).toBe(input.imageUID)
        expect(movie.displayPeriod).toBeDefined()
      })

      it('deve lançar erro técnico quando objeto parâmetro for inválido', () => {
        // Assert
        expect(() => Movie.hydrate(null as any)).toThrow()
      })

      describe('deve lançar erro quando algum valor estritamente necessário for inválido', () => {
        const nullCases = [
          { scenario: 'uid is null', input: createHydrateInput({ uid: null as unknown as string }) },
          { scenario: 'title is null', input: createHydrateInput({ title: null as any }) },
          { scenario: 'description is null', input: createHydrateInput({ description: null as any }) },
          { scenario: 'duration is null', input: createHydrateInput({ duration: null as unknown as number }) },
          { scenario: 'age rating is null', input: createHydrateInput({ ageRating: null as unknown as string }) },
          { scenario: 'status is null', input: createHydrateInput({ status: null as any }) },
          { scenario: 'genre is null', input: createHydrateInput({ genres: null as any }) },
          { scenario: 'imageUID is null', input: createHydrateInput({ imageUID: null as unknown as string }) },
          { scenario: 'contributors is null', input: createHydrateInput({ contributors: null as any }) },
          { scenario: 'display period is null', input: createHydrateInput({ displayPeriod: null as any }) },
        ]

        nullCases.forEach(({ scenario, input }) => {
          it(scenario, () => {
            // Act
            expect(() => Movie.hydrate(input as unknown as IMovieHydrateInput)).toThrow(TechnicalError)
          })
        })
      })
    })
  })

  describe('Instance Methods', () => {
    let failures: SimpleFailure[]
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
      failures = []
      movie = Movie.hydrate(createHydrateInput())
    })

    describe('updateTitle', () => {
      it('deve atualizar o título com sucesso', () => {
        // Arrange
        const newTitle = [
          { language: SupportedLanguage.PT, text: 'Novo Título' },
          { language: SupportedLanguage.EN, text: 'New Títle' },
        ]

        // Act
        const result = validateAndCollect(movie.updateTitle(newTitle), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.title.content(SupportedLanguage.PT)).toBe(newTitle[0].text)
        expectOnlyPropertyUpdated(movie, result, 'title')
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
          { language: SupportedLanguage.PT, text: faker.string.alphanumeric({ length: { min: 48, max: 240 } }) },
          { language: SupportedLanguage.EN, text: faker.string.alphanumeric({ length: { min: 48, max: 240 } }) },
        ]

        // Act
        const result = validateAndCollect(movie.updateDescription(newDescription), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.description.content(SupportedLanguage.PT)).toBe(newDescription[0].text)
        expectOnlyPropertyUpdated(movie, result, 'description')
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
        const result = validateAndCollect(movie.updateContributors(newContributors), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.contributors.count).toBe(newContributors.length)
        expect(result.contributors.getAll().some((c) => c.personUID.value === newContributors[0].personUID)).toBe(true)
        expect(result.contributors.getAll().some((c) => c.personUID.value === newContributors[1].personUID)).toBe(true)
        expectOnlyPropertyUpdated(movie, result, 'contributors')
      })

      it('deve falhar se dados inválidos forem fornecidos', () => {
        // Act
        const result = movie.updateContributors(null as any)

        // Assert
        expect(result.isInvalid()).toBe(true)
      })

      it('deve falhar ao remover o único diretor', () => {
        // Arrange
        const movieWithOnlyDirector = Movie.hydrate(
          createHydrateInput({
            contributors: [{ personUID: PersonUID.create().value, role: PersonRole.DIRECTOR }],
          })
        )

        // Act
        const result = validateAndCollect(movieWithOnlyDirector.updateContributors([]), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MOVIE_MISSING_CONTRIBUTORS)
      })
    })

    describe('setDuration', () => {
      it('deve definir duração com sucesso', () => {
        // Arrange
        const newDuration = 150

        // Act
        const result = validateAndCollect(movie.setDuration(newDuration), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.duration?.minutes).toBe(newDuration)
        expectOnlyPropertyUpdated(movie, result, 'duration')
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
        const result = validateAndCollect(movie.updateAgeRating(AgeRatingEnum.TEN), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.ageRating.value).toBe('10')
        expectOnlyPropertyUpdated(movie, result, 'ageRating')
      })

      it('deve falhar com classificação etária inválida', () => {
        // Act
        const result = validateAndCollect(movie.updateAgeRating('INVALID' as AgeRatingEnum), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE)
      })
    })

    describe('setGenres', () => {
      it('deve definir gêneros com sucesso', () => {
        // Act
        const result = validateAndCollect(movie.setGenres([Genre.ACTION, Genre.COMEDY]), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.genre?.getGenres().some((g) => g === Genre.ACTION)).toBe(true)
        expect(result.genre?.getGenres().some((g) => g === Genre.COMEDY)).toBe(true)
        expectOnlyPropertyUpdated(movie, result, 'genre')
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
        const result = validateAndCollect(movie.updatePosterImage(newImageUID), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.imageUID.value).toBe(newImageUID)
        expectOnlyPropertyUpdated(movie, result, 'imageUID')
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
        const startDate = createDate(1)
        const endDate = createDate(30)

        // Act
        const result = validateAndCollect(movie.setDisplayPeriod(startDate, endDate), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.displayPeriod?.startDate).toEqual(startDate)
        expect(result.displayPeriod?.endDate).toEqual(endDate)
        expectOnlyPropertyUpdated(movie, result, 'displayPeriod')
      })

      it('deve falhar com data de início posterior à data de fim', () => {
        // Arrange
        const startDate = createDate(5)
        const endDate = createDate(2)

        // Act
        const result = movie.setDisplayPeriod(startDate, endDate)

        // Assert
        expect(result.isInvalid()).toBe(true)
      })
    })

    describe('toPendingReview', () => {
      it('deve mudar para pendente de revisão quando todos requisitos são atendidos', () => {
        // Act
        const result = validateAndCollect(movie.toPendingReview(), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.status).toBe(MovieAdministrativeStatus.PENDING_REVIEW)
        expectOnlyPropertyUpdated(movie, result, 'status')
      })

      it('deve falhar ao tentar mudar para pendente quando não houver um diretor associado ao filme', () => {
        // Arrange
        const movieWithoutDirector = Movie.hydrate(
          createHydrateInput({
            contributors: [{ personUID: PersonUID.create().value, role: PersonRole.ACTOR }],
          })
        )

        // Act
        const result = validateAndCollect(movieWithoutDirector.toPendingReview(), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MOVIE_DIRECTOR_REQUIRED)
      })

      it('deve falhar se o filme já estiver em APPROVED', () => {
        // Arrange
        const movieApproved = Movie.hydrate(
          createHydrateInput({
            status: MovieAdministrativeStatus.APPROVED,
          })
        )

        // Act
        const result = validateAndCollect(movieApproved.toPendingReview(), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MOVIE_ALREADY_APPROVED)
      })

      it('deve falhar se o filme já estiver em ARCHIVED', () => {
        // Arrange
        const movieArchived = Movie.hydrate(
          createHydrateInput({
            status: MovieAdministrativeStatus.ARCHIVED,
          })
        )

        // Act
        const result = validateAndCollect(movieArchived.toPendingReview(), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MOVIE_IS_ARCHIVED)
      })

      it('deve manter o mesmo status se já estiver em PENDING_REVIEW', () => {
        // Arrange
        const moviePending = Movie.hydrate(
          createHydrateInput({
            status: MovieAdministrativeStatus.PENDING_REVIEW,
          })
        )

        // Act
        const result = validateAndCollect(moviePending.toPendingReview(), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.status).toBe(MovieAdministrativeStatus.PENDING_REVIEW)
      })
    })

    describe('toApprove', () => {
      it('deve aprovar um filme quando todos os requisitos são atendidos', () => {
        // Arrange
        const moviePending = Movie.hydrate(
          createHydrateInput({
            status: MovieAdministrativeStatus.PENDING_REVIEW,
            duration: 120,
            genres: [Genre.ACTION],
          })
        )

        // Act
        const result = validateAndCollect(moviePending.toApprove(), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.status).toBe(MovieAdministrativeStatus.APPROVED)
        expectOnlyPropertyUpdated(moviePending, result, 'status')
      })

      it('deve falhar quando o filme já possui o status "APPROVED"', () => {
        // Arrange
        const approvedMovie = Movie.hydrate(
          createHydrateInput({
            status: MovieAdministrativeStatus.APPROVED,
            duration: 120,
            genres: [Genre.ACTION],
          })
        )

        // Act
        const result = validateAndCollect(approvedMovie.toApprove(), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MOVIE_ALREADY_APPROVED)
      })

      it('deve falhar quando não está em PENDING_REVIEW', () => {
        // Act (movie está em DRAFT por padrão)
        const result = validateAndCollect(movie.toApprove(), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MOVIE_NOT_IN_DRAFT)
      })

      it('deve falhar ao tentar aprovar sem gêneros definidos', () => {
        // Arrange
        const moviePending = Movie.hydrate(
          createHydrateInput({
            status: MovieAdministrativeStatus.PENDING_REVIEW,
            duration: 120,
            genres: [],
          })
        )

        // Act
        const result = moviePending.toApprove()

        // Assert
        expect(result.isInvalid()).toBe(true)
      })

      it('deve falhar quando não tem duração definida', () => {
        // Arrange
        const moviePending = Movie.hydrate(
          createHydrateInput({
            status: MovieAdministrativeStatus.PENDING_REVIEW,
            duration: null as unknown as number,
            genres: [Genre.ACTION],
          })
        )

        // Act
        const result = validateAndCollect(moviePending.toApprove(), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
      })

      it('deve falhar quando não tem um diretor definido', () => {
        // Arrange
        const moviePending = Movie.hydrate(
          createHydrateInput({
            status: MovieAdministrativeStatus.PENDING_REVIEW,
            duration: 120,
            genres: [Genre.ACTION],
            contributors: [{ personUID: PersonUID.create().value, role: PersonRole.ACTOR }],
          })
        )

        // Act
        const result = validateAndCollect(moviePending.toApprove(), failures)

        // Assert
        expect(result).toBeNull()
        expect(failures[0].code).toBe(FailureCode.MOVIE_DIRECTOR_REQUIRED)
      })
    })

    describe('toArchive', () => {
      it('deve arquivar um filme aprovado com sucesso', () => {
        // Arrange
        const approvedMovie = Movie.hydrate(
          createHydrateInput({
            status: MovieAdministrativeStatus.APPROVED,
          })
        )

        // Act
        const result = validateAndCollect(approvedMovie.toArchive(), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.status).toBe(MovieAdministrativeStatus.ARCHIVED)
        expectOnlyPropertyUpdated(approvedMovie, result, 'status')
      })

      it('deve arquivar um filme com status em DRAFT com sucesso', () => {
        // Act (está em draft por d=adrão)
        const result = validateAndCollect(movie.toArchive(), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.status).toBe(MovieAdministrativeStatus.ARCHIVED)
        expectOnlyPropertyUpdated(movie, result, 'status')
      })

      it('deve arquivar com sucesso um filme com status igual à PENDING_REVIEW', () => {
        // Arrange
        const pendingMovie = Movie.hydrate(
          createHydrateInput({
            status: MovieAdministrativeStatus.PENDING_REVIEW,
          })
        )

        // Act
        const result = validateAndCollect(pendingMovie.toArchive(), failures)

        // Assert
        expect(result).toBeDefined()
      })

      it('deve manter o mesmo status se já estiver arquivado', () => {
        // Arrange
        const archivedMovie = Movie.hydrate(
          createHydrateInput({
            status: MovieAdministrativeStatus.ARCHIVED,
          })
        )

        // Act
        const result = validateAndCollect(archivedMovie.toArchive(), failures)

        // Assert
        expect(result).toBeDefined()
        expect(result.status).toBe(MovieAdministrativeStatus.ARCHIVED)
      })
    })

    describe('isAvailableForPeriod', () => {
      const setupAvailabilityTest = () => {
        const now = new Date()
        const startDate = new Date(now)
        const endDate = new Date(now)
        endDate.setDate(endDate.getDate() + 10)

        const movie = Movie.hydrate(
          createHydrateInput({
            displayPeriod: { startDate, endDate },
            status: MovieAdministrativeStatus.APPROVED,
          })
        )

        return { now, startDate, endDate, movie }
      }

      it('deve aceitar data proposta dentro do período de exibição', () => {
        // Arrange
        const { movie } = setupAvailabilityTest()
        const proposedDate = createDate(5)

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
        const proposedDate = createDate(-15)

        // Act
        const result = movie.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(false)
      })

      it('deve rejeitar data proposta após o período de exibição', () => {
        // Arrange
        const { movie } = setupAvailabilityTest()
        const proposedDate = createDate(15)

        // Act
        const result = movie.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(false)
      })

      it('deve rejeitar quando o filme não tem período de exibição definido', () => {
        // Arrange
        const movieWithoutPeriod = Movie.hydrate(
          createHydrateInput({
            displayPeriod: null as any,
            status: MovieAdministrativeStatus.APPROVED,
          })
        )
        const proposedDate = new Date()

        // Act
        const result = movieWithoutPeriod.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(false)
      })

      it('deve rejeitar quando o filme não está aprovado', () => {
        // Arrange
        const { startDate, endDate } = setupAvailabilityTest()
        const movieNotApproved = Movie.hydrate(
          createHydrateInput({
            displayPeriod: { startDate, endDate },
            status: MovieAdministrativeStatus.DRAFT,
          })
        )
        const proposedDate = new Date(startDate)

        // Act
        const result = movieNotApproved.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(false)
      })

      it('deve rejeitar quando o filme está arquivado', () => {
        // Arrange
        const { startDate, endDate } = setupAvailabilityTest()
        const archivedMovie = Movie.hydrate(
          createHydrateInput({
            displayPeriod: { startDate, endDate },
            status: MovieAdministrativeStatus.ARCHIVED,
          })
        )
        const proposedDate = new Date(startDate)

        // Act
        const result = archivedMovie.isAvailableForPeriod(proposedDate)

        // Assert
        expect(result).toBe(false)
      })

      it('deve rejeitar quando o filme está pendente de revisão', () => {
        // Arrange
        const { startDate, endDate } = setupAvailabilityTest()
        const pendingMovie = Movie.hydrate(
          createHydrateInput({
            displayPeriod: { startDate, endDate },
            status: MovieAdministrativeStatus.PENDING_REVIEW,
          })
        )
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
        const movieWithoutDirector = Movie.hydrate(
          createHydrateInput({
            contributors: [{ personUID: PersonUID.create().value, role: PersonRole.ACTOR }],
          })
        )

        // Act
        const result = movieWithoutDirector.hasMinimumRequirementsForReview()

        // Assert
        expect(result).toBe(false)
      })

      it('deve retornar false quando não tem contribuidores', () => {
        // Arrange
        const movieWithoutContributors = Movie.hydrate(
          createHydrateInput({
            contributors: [],
          })
        )

        // Act
        const result = movieWithoutContributors.hasMinimumRequirementsForReview()

        // Assert
        expect(result).toBe(false)
      })
    })

    describe('hasAllRequirementsForApproval', () => {
      it('deve retornar true quando tem todos os requisitos para aprovação', () => {
        // Arrange
        const completeMovie = Movie.hydrate(
          createHydrateInput({
            duration: 120,
            genres: [Genre.ACTION],
          })
        )

        // Act
        const result = completeMovie.hasAllRequirementsForApproval()

        // Assert
        expect(result).toBe(true)
      })

      it('deve retornar false quando não tem duração', () => {
        // Arrange
        const movieWithoutDuration = Movie.hydrate(
          createHydrateInput({
            duration: null as any,
            genres: [Genre.ACTION],
          })
        )

        // Act
        const result = movieWithoutDuration.hasAllRequirementsForApproval()

        // Assert
        expect(result).toBe(false)
      })

      it('deve retornar false quando não tem gêneros', () => {
        // Arrange
        const movieWithoutGenres = Movie.hydrate(
          createHydrateInput({
            duration: 120,
            genres: [],
          })
        )

        // Act
        const result = movieWithoutGenres.hasAllRequirementsForApproval()

        // Assert
        expect(result).toBe(false)
      })

      it('deve retornar false quando não tem diretor', () => {
        // Arrange
        const movieWithoutDirector = Movie.hydrate(
          createHydrateInput({
            duration: 120,
            genres: [Genre.ACTION],
            contributors: [{ personUID: PersonUID.create().value, role: PersonRole.ACTOR }],
          })
        )

        // Act
        const result = movieWithoutDirector.hasAllRequirementsForApproval()

        // Assert
        expect(result).toBe(false)
      })

      it('deve retornar false quando não atende aos requisitos mínimos para revisão', () => {
        // Arrange
        const incompleteMovie = Movie.hydrate(
          createHydrateInput({
            duration: 120,
            genres: [Genre.ACTION],
            contributors: [], // Sem contribuidores
          })
        )

        // Act
        const result = incompleteMovie.hasAllRequirementsForApproval()

        // Assert
        expect(result).toBe(false)
      })
    })
  })
})
