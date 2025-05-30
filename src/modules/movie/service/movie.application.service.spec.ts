import { Test, TestingModule } from '@nestjs/testing'
import { v4, v7 } from 'uuid'
import { IMovieRepository, IMovieWithRelations } from '../repository/movie.repository.interface'
import { MovieUID } from '../entity/value-object/movie.uid'
import { ICreateMovieInput, Movie } from '../entity/movie'
import { IMovieFilterInput, MovieFilter } from '../entity/value-object/movie.filter'
import { failure, success } from '@shared/result/result'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { MovieApplicationService } from '@modules/movie/service/movie.application.service'
import { validateAndCollect } from '@shared/validator/common.validators'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { MOVIE_REPOSITORY } from '@modules/movie/constant/movie.constant'
import { IMultilingualInput } from '@shared/value-object/multilingual-content'
import { faker } from '@faker-js/faker'
import { Person } from '@modules/person/entity/person'
import { Image } from '@modules/image/entity/image'

describe('MovieApplicationService - Testes de Integração', () => {
  let movieService: MovieApplicationService
  let repositoryMock: jest.Mocked<IMovieRepository>
  let movieMock: jest.Mocked<Movie>
  let validMovieUID: MovieUID
  let failures: SimpleFailure[]
  let module: TestingModule

  const validCreateInput: ICreateMovieInput = {
    title: [
      { language: 'pt', text: faker.lorem.sentence({ min: 3, max: 6 }) },
      { language: 'en', text: faker.lorem.sentence({ min: 3, max: 6 }) },
    ],
    description: [
      { language: 'pt', text: faker.lorem.paragraphs({ min: 2, max: 4 }) },
      { language: 'en', text: faker.lorem.paragraphs({ min: 2, max: 4 }) },
    ],
    ageRating: '12',
    imageUID: 'IMG.' + v7(),
    contributors: [
      { personUID: 'PERSON.' + v7(), role: 'director' },
      { personUID: 'PERSON.' + v7(), role: 'actor' },
    ],
    durationInMinutes: 123,
  }

  const validFilters: IMovieFilterInput = {
    genres: ['ACTION', 'COMEDY'],
    ageRating: '12',
  }

  const movieWithRelationsMock: IMovieWithRelations = {
    movie: {} as Movie,
    image: Image.hydrate({
      uid: v4(),
      title: {
        text: faker.lorem.sentence({ min: 3, max: 6 }),
        language: 'en',
      },
      description: {
        text: faker.lorem.paragraphs({ min: 2, max: 4 }),
        language: 'en',
      },
      sizes: {
        small: faker.image.url(),
        normal: faker.image.url(),
        large: faker.image.url(),
      },
    }),
    contributors: [Person.hydrate(v4(), faker.person.firstName(), faker.date.birthdate())],
  }

  beforeEach(async () => {
    failures = []
    validMovieUID = MovieUID.create()

    repositoryMock = {
      findById: jest.fn(),
      findByIdWithRelations: jest.fn(),
      findMany: jest.fn(),
      findManyWithRelations: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IMovieRepository>

    movieMock = {
      uid: validMovieUID,
      title: validCreateInput.title,
      description: validCreateInput.description,
      ageRating: validCreateInput.ageRating,
      status: 'DRAFT',
      toPendingReview: jest.fn(),
      toApprove: jest.fn(),
      toArchive: jest.fn(),
      updateTitle: jest.fn(),
      updateDescription: jest.fn(),
      setDuration: jest.fn(),
      removeDuration: jest.fn(),
      updateAgeRating: jest.fn(),
      setGenres: jest.fn(),
      removeGenres: jest.fn(),
      updatePosterImage: jest.fn(),
      setDisplayPeriod: jest.fn(),
      removeDisplayPeriod: jest.fn(),
    } as unknown as jest.Mocked<Movie>

    module = await Test.createTestingModule({
      providers: [
        MovieApplicationService,
        {
          provide: MOVIE_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile()

    movieService = module.get<MovieApplicationService>(MovieApplicationService)
  })

  afterEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    await module.close()
  })

  describe('findById', () => {
    it('deve retornar um filme quando encontrado pelo UID válido', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(movieMock)

      // Act
      const result = validateAndCollect(await movieService.findById(validMovieUID.value), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result).toEqual(movieMock)
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findById).toHaveBeenCalledWith(validMovieUID)
      expect(failures).toHaveLength(0)
    })

    it('deve retornar failure quando UID for inválido', async () => {
      // Arrange
      const invalidUID = 'uid-inválido'

      // Act
      const result = validateAndCollect(await movieService.findById(invalidUID), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.UID_WITH_INVALID_FORMAT)
      expect(repositoryMock.findById).not.toHaveBeenCalled()
    })

    it('deve retornar failure quando filme não existir', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = validateAndCollect(await movieService.findById(validMovieUID.value), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND)
      expect(repositoryMock.findById).toHaveBeenCalledWith(validMovieUID)
    })

    it('deve propagar erro do repositório', async () => {
      // Arrange
      const repositoryError = new Error('Erro de conexão com banco')
      repositoryMock.findById.mockRejectedValue(repositoryError)

      // Act & Assert
      await expect(movieService.findById(validMovieUID.value)).rejects.toThrow(repositoryError)
      expect(repositoryMock.findById).toHaveBeenCalledWith(validMovieUID)
    })
  })

  describe('findByIdWithRelations', () => {
    it('deve retornar filme com relacionamentos quando encontrado', async () => {
      // Arrange
      repositoryMock.findByIdWithRelations.mockResolvedValue(movieWithRelationsMock)

      // Act
      const result = validateAndCollect(await movieService.findByIdWithRelations(validMovieUID.value), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result).toEqual(movieWithRelationsMock)
      expect(result.movie).toBeDefined()
      expect(result.image).toBeDefined()
      expect(result.contributors).toHaveLength(1)
      expect(repositoryMock.findByIdWithRelations).toHaveBeenCalledWith(validMovieUID)
      expect(repositoryMock.findByIdWithRelations).toHaveBeenCalledTimes(1)
    })

    it('deve retornar failure quando UID for inválido', async () => {
      // Arrange
      const invalidUID = 'uid-invalido'

      // Act
      const result = validateAndCollect(await movieService.findByIdWithRelations(invalidUID), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures[0].code).toBe(FailureCode.UID_WITH_INVALID_FORMAT)
      expect(repositoryMock.findByIdWithRelations).not.toHaveBeenCalled()
    })

    it('deve retornar failure quando filme não existir', async () => {
      // Arrange
      repositoryMock.findByIdWithRelations.mockResolvedValue(null)

      // Act
      const result = validateAndCollect(await movieService.findByIdWithRelations(validMovieUID.value), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND)
      expect(repositoryMock.findByIdWithRelations).toHaveBeenCalledWith(validMovieUID)
      expect(repositoryMock.findByIdWithRelations).toHaveBeenCalledTimes(1)
    })

    it('deve propagar erro do repositório', async () => {
      const repositoryError = new Error('Erro de conexão')
      repositoryMock.findByIdWithRelations.mockRejectedValue(repositoryError)
      await expect(movieService.findByIdWithRelations(validMovieUID.value)).rejects.toThrow(repositoryError)
    })
  })

  describe('findMany', () => {
    it('deve retornar lista de filmes quando filtros são válidos', async () => {
      // Arrange
      const movies = [movieMock, { ...movieMock, uid: MovieUID.create() } as unknown as Movie]
      const filterInstance = MovieFilter.create(validFilters)
      jest.spyOn(MovieFilter, 'create').mockReturnValue(filterInstance)
      repositoryMock.findMany.mockResolvedValue(movies)

      // Act
      const result = validateAndCollect(await movieService.findMany(validFilters), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result).toHaveLength(2)
      expect(result).toEqual(movies)
      expect(MovieFilter.create).toHaveBeenCalledWith(validFilters)
      expect(MovieFilter.create).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findMany).toHaveBeenCalledTimes(1)
    })

    it('deve retornar lista vazia quando nenhum filme corresponder aos filtros', async () => {
      // Arrange
      repositoryMock.findMany.mockResolvedValue([])

      // Act
      const result = validateAndCollect(await movieService.findMany(validFilters), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result).toHaveLength(0)
      expect(repositoryMock.findMany).toHaveBeenCalledTimes(1)
    })

    it('deve retornar failure quando validação dos filtros falhar', async () => {
      // Arrange
      const filterFailures = [{ code: FailureCode.INVALID_ENUM_VALUE }]
      jest.spyOn(MovieFilter, 'create').mockReturnValue(failure(filterFailures))

      // Act
      const result = validateAndCollect(await movieService.findMany(validFilters), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(filterFailures)
      expect(MovieFilter.create).toHaveBeenCalledWith(validFilters)
      expect(MovieFilter.create).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findMany).not.toHaveBeenCalled()
    })
  })

  describe('findManyWithRelations', () => {
    it('deve retornar lista de filmes com relacionamentos', async () => {
      // Arrange
      const moviesWithRelations = [movieWithRelationsMock]
      repositoryMock.findManyWithRelations.mockResolvedValue(moviesWithRelations)

      const filterInstance = MovieFilter.create(validFilters) as MovieFilter
      jest.spyOn(MovieFilter, 'create').mockReturnValue(success(filterInstance))

      // Act
      const result = validateAndCollect(await movieService.findManyWithRelations(validFilters), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result).toHaveLength(1)
      expect(result[0].movie).toBeDefined()
      expect(result[0].image).toBeDefined()
      expect(result[0].contributors).toBeDefined()
      expect(MovieFilter.create).toHaveBeenCalledWith(validFilters)
      expect(MovieFilter.create).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findManyWithRelations).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findManyWithRelations).toHaveBeenCalledWith(filterInstance)
    })

    it('deve retornar lista vazia quando nenhum filme com relacionamentos corresponder', async () => {
      // Arrange
      repositoryMock.findManyWithRelations.mockResolvedValue([])

      // Act
      const result = validateAndCollect(await movieService.findManyWithRelations(validFilters), failures)

      // Assert
      expect(result).toEqual([])
    })

    it('deve retornar failure quando validação dos filtros falhar', async () => {
      // Arrange
      const invalidFilters = { ...validFilters, ageRating: 'INVALID_AGE' }

      // Act
      const result = validateAndCollect(await movieService.findManyWithRelations(invalidFilters), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures[0].code).toBe(FailureCode.INVALID_ENUM_VALUE)
    })

    it('deve propagar erro do repositório', async () => {
      // Arrange
      const repositoryError = new Error('Erro de conexão')
      repositoryMock.findManyWithRelations.mockRejectedValue(repositoryError)

      // Act & Assert
      await expect(movieService.findManyWithRelations(validFilters)).rejects.toThrow(repositoryError)
    })
  })

  describe('create', () => {
    it('deve criar filme com sucesso quando dados são válidos', async () => {
      // Arrange
      jest.spyOn(Movie, 'create').mockReturnValue(success(movieMock))
      repositoryMock.save.mockResolvedValue(movieMock)

      // Act
      const result = validateAndCollect(await movieService.create(validCreateInput), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result).toEqual(movieMock)
      expect(Movie.create).toHaveBeenCalledWith(validCreateInput)
      expect(repositoryMock.save).toHaveBeenCalledWith(movieMock)
      expect(repositoryMock.save).toHaveBeenCalledTimes(1)
      expect(failures).toHaveLength(0)
    })

    it('deve retornar failure quando input for null', async () => {
      // Act
      const result = validateAndCollect(await movieService.create(null as any), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toHaveLength(1)
      expect(failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA)
      expect(repositoryMock.save).not.toHaveBeenCalled()
    })

    it('deve retornar failure quando validação da entidade falhar', async () => {
      // Arrange
      const entityFailures = [{ code: FailureCode.UID_WITH_INVALID_FORMAT }]
      jest.spyOn(Movie, 'create').mockReturnValue(failure(entityFailures))

      // Act
      const result = validateAndCollect(await movieService.create(validCreateInput), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(entityFailures)
      expect(repositoryMock.save).not.toHaveBeenCalled()
    })

    it('deve propagar erro do repositório durante save', async () => {
      // Arrange
      jest.spyOn(Movie, 'create').mockReturnValue(success(movieMock))
      const saveError = new Error('Erro ao salvar no banco')
      repositoryMock.save.mockRejectedValue(saveError)

      // Act & Assert
      await expect(movieService.create(validCreateInput)).rejects.toThrow(saveError)
    })
  })

  describe('submitForReview', () => {
    it('deve enviar filme para revisão com sucesso', async () => {
      // Arrange
      const pendingReviewMovie = { ...movieMock, status: 'PENDING_REVIEW' } as unknown as Movie
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.toPendingReview.mockReturnValue(success(pendingReviewMovie))
      repositoryMock.update.mockResolvedValue(pendingReviewMovie)

      // Act
      const result = validateAndCollect(await movieService.submitForReview(validMovieUID.value), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result).toEqual(pendingReviewMovie)
      expect(movieMock.toPendingReview).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith(pendingReviewMovie)
      expect(repositoryMock.update).toHaveBeenCalledTimes(1)
    })

    it('deve retornar failure quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = validateAndCollect(await movieService.submitForReview(validMovieUID.value), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    it('deve retornar failure quando transição de estado falhar', async () => {
      // Arrange
      const transitionFailures = [{ code: FailureCode.MOVIE_ALREADY_APPROVED }]
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.toPendingReview.mockReturnValue(failure(transitionFailures))

      // Act
      const result = validateAndCollect(await movieService.submitForReview(validMovieUID.value), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(transitionFailures)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    it('deve retornar failure quando transição de estado toPendingReview falhar', async () => {
      // Arrange
      const transitionFailures = [{ code: FailureCode.MOVIE_ALREADY_APPROVED }]
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.toPendingReview.mockReturnValue(failure(transitionFailures))

      // Act
      const result = validateAndCollect(await movieService.submitForReview(validMovieUID.value), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(transitionFailures)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    it('deve propagar erro do repositório durante update', async () => {
      // Arrange
      const updateError = new Error('Erro ao atualizar')
      const pendingReviewMovie = { ...movieMock, status: 'PENDING_REVIEW' } as unknown as Movie
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.toPendingReview.mockReturnValue(success(pendingReviewMovie))
      repositoryMock.update.mockRejectedValue(updateError)

      await expect(movieService.submitForReview(validMovieUID.value)).rejects.toThrow(updateError)
    })
  })

  describe('approve', () => {
    it('deve aprovar filme com sucesso', async () => {
      // Arrange
      const approvedMovie = { ...movieMock, status: 'APPROVED' } as unknown as Movie
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.toApprove.mockReturnValue(success(approvedMovie))
      repositoryMock.update.mockResolvedValue(approvedMovie)

      // Act
      const result = validateAndCollect(await movieService.approve(validMovieUID.value), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result).toEqual(approvedMovie)
      expect(movieMock.toApprove).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith(approvedMovie)
    })

    it('deve retornar failure quando aprovação falhar por regras de negócio', async () => {
      // Arrange
      const approvalFailures = [{ code: FailureCode.MOVIE_MISSING_CONTRIBUTORS }]
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.toApprove.mockReturnValue(failure(approvalFailures))

      // Act
      const result = validateAndCollect(await movieService.approve(validMovieUID.value), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(approvalFailures)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    it('deve retornar failure quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = validateAndCollect(await movieService.approve(validMovieUID.value), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve retornar failure quando transição de estado toApprove falhar', async () => {
      // Arrange
      const transitionFailures = [{ code: FailureCode.MOVIE_ALREADY_APPROVED }]
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.toApprove.mockReturnValue(failure(transitionFailures))

      // Act
      const result = validateAndCollect(await movieService.approve(validMovieUID.value), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(transitionFailures)
    })
  })

  describe('archive', () => {
    it('deve arquivar filme com sucesso', async () => {
      // Arrange
      const archivedMovie = { ...movieMock, status: 'ARCHIVED' } as unknown as Movie
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.toArchive.mockReturnValue(success(archivedMovie))
      repositoryMock.update.mockResolvedValue(archivedMovie)

      // Act
      const result = validateAndCollect(await movieService.archive(validMovieUID.value), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result).toEqual(archivedMovie)
      expect(movieMock.toArchive).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith(archivedMovie)
    })

    it('deve retornar failure quando arquivamento falhar', async () => {
      // Arrange
      const archiveFailures = [{ code: FailureCode.MOVIE_ALREADY_APPROVED }]
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.toArchive.mockReturnValue(failure(archiveFailures))

      // Act
      const result = validateAndCollect(await movieService.archive(validMovieUID.value), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(archiveFailures)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })

    it('deve retornar failure quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = validateAndCollect(await movieService.archive(validMovieUID.value), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve retornar failure quando transição de estado toArchive falhar', async () => {
      // Arrange
      const transitionFailures = [{ code: FailureCode.MOVIE_ALREADY_APPROVED }]
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.toArchive.mockReturnValue(failure(transitionFailures))

      // Act
      const result = validateAndCollect(await movieService.archive(validMovieUID.value), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(transitionFailures)
    })
  })

  describe('updateTitle', () => {
    const newTitle: IMultilingualInput[] = [
      { language: 'pt', text: 'Novo Título' },
      { language: 'en', text: 'New Title' },
    ]

    it('deve atualizar título com sucesso', async () => {
      // Arrange
      const updatedMovie = { ...movieMock, title: newTitle } as unknown as Movie
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.updateTitle.mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovie)

      // Act
      const result = validateAndCollect(await movieService.updateTitle(validMovieUID.value, newTitle), failures)

      // Assert
      expect(result).toBeDefined()
      expect(result).toEqual(updatedMovie)
      expect(movieMock.updateTitle).toHaveBeenCalledWith(newTitle)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
    })

    it('deve retornar failure quando título for inválido', async () => {
      // Arrange
      const titleFailures = [{ code: FailureCode.MISSING_REQUIRED_DATA }]
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.updateTitle.mockReturnValue(failure(titleFailures))

      // Act
      const result = validateAndCollect(await movieService.updateTitle(validMovieUID.value, newTitle), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(titleFailures)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })
  })

  describe('updateDescription', () => {
    const validDescriptionInput: IMultilingualInput[] = [{ language: 'pt', text: 'Nova descrição.' }]
    it('deve atualizar a descrição com sucesso', async () => {
      // Arrange
      const updatedMovie = { ...movieMock, description: validDescriptionInput } as unknown as Movie
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.updateDescription.mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovie)

      // Act
      const result = validateAndCollect(
        await movieService.updateDescription(validMovieUID.value, validDescriptionInput),
        failures
      )

      // Assert
      expect(result).toEqual(updatedMovie)
      expect(movieMock.updateDescription).toHaveBeenCalledWith(validDescriptionInput)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
    })

    it('deve retornar failure quando Movie.updateDescription falhar', async () => {
      // Arrange
      const updateFailures = [{ code: FailureCode.INVALID_ENUM_VALUE }]
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.updateDescription.mockReturnValue(failure(updateFailures))

      // Act
      const result = validateAndCollect(
        await movieService.updateDescription(validMovieUID.value, validDescriptionInput),
        failures
      )

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(updateFailures)
    })
  })

  describe('setDuration', () => {
    it('deve definir duração com sucesso', async () => {
      // Arrange
      const durationInMinutes = 180
      const updatedMovie = { ...movieMock, duration: durationInMinutes } as unknown as Movie
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.setDuration.mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovie)

      // Act
      const result = validateAndCollect(
        await movieService.setDuration(validMovieUID.value, durationInMinutes),
        failures
      )

      // Assert
      expect(result).toBeDefined()
      expect(result).toEqual(updatedMovie)
      expect(movieMock.setDuration).toHaveBeenCalledWith(durationInMinutes)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
    })

    it('deve retornar failure quando duração for inválida', async () => {
      // Arrange
      const invalidDuration = -10
      const durationFailures = [{ code: FailureCode.UID_WITH_INVALID_FORMAT, message: 'Duração inválida' }]
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.setDuration.mockReturnValue(failure(durationFailures))

      // Act
      const result = validateAndCollect(await movieService.setDuration(validMovieUID.value, invalidDuration), failures)

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(durationFailures)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })
  })

  describe('setDisplayPeriod', () => {
    it('deve definir período de exibição com sucesso', async () => {
      // Arrange
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')
      const updatedMovie = { ...movieMock } as unknown as Movie
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.setDisplayPeriod.mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovie)

      // Act
      const result = validateAndCollect(
        await movieService.setDisplayPeriod(validMovieUID.value, startDate, endDate),
        failures
      )

      // Assert
      expect(result).toBeDefined()
      expect(result).toEqual(updatedMovie)
      expect(movieMock.setDisplayPeriod).toHaveBeenCalledWith(startDate, endDate)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
    })

    it('deve retornar failure quando período for inválido', async () => {
      // Arrange
      const startDate = new Date('2024-12-31')
      const endDate = new Date('2024-01-01') // Data final antes da inicial
      const periodFailures = [{ code: FailureCode.MOVIE_MISSING_CONTRIBUTORS }]
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.setDisplayPeriod.mockReturnValue(failure(periodFailures))

      // Act
      const result = validateAndCollect(
        await movieService.setDisplayPeriod(validMovieUID.value, startDate, endDate),
        failures
      )

      // Assert
      expect(result).toBeNull()
      expect(failures).toEqual(periodFailures)
      expect(repositoryMock.update).not.toHaveBeenCalled()
    })
  })

  describe('cenários de erro genéricos para métodos de atualização', () => {
    ;['updateTitle', 'updateDescription', 'setDuration', 'setDisplayPeriod', 'updateDescription'].forEach(
      (methodName) => {
        describe(`${methodName} - Cenários de Erro Comuns`, () => {
          const dummyInput = methodName === 'setDuration' ? 100 : [] // Input apropriado para cada método

          it('deve retornar failure quando filme não for encontrado', async () => {
            repositoryMock.findById.mockResolvedValue(null)
            const result = validateAndCollect(
              await (movieService as any)[methodName](validMovieUID.value, dummyInput),
              failures
            )
            expect(result).toBeNull()
            expect(failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND)
          })

          it('deve propagar erro do repositório durante update', async () => {
            const updateError = new Error('Erro ao atualizar no DB')
            repositoryMock.findById.mockResolvedValue(movieMock)
            ;(movieMock as any)[methodName === 'setDuration' ? 'setDuration' : methodName].mockReturnValue(
              success(movieMock)
            ) // Simula sucesso da entidade
            repositoryMock.update.mockRejectedValue(updateError)

            await expect((movieService as any)[methodName](validMovieUID.value, dummyInput)).rejects.toThrow(
              updateError
            )
          })

          it('deve retornar failure quando UID for inválido', async () => {
            // Arrange
            const invalidUID = 'uid-invalido'

            // Act
            const result = validateAndCollect(await (movieService as any)[methodName](invalidUID, dummyInput), failures)

            // Assert
            expect(result).toBeNull()
            expect(failures[0].code).toBe(FailureCode.UID_WITH_INVALID_FORMAT)
          })
        })
      }
    )
  })

  describe('Cenários de Erro Gerais', () => {
    it('deve lidar com falha de conexão do repositório em operações de busca', async () => {
      // Arrange
      const connectionError = new Error('Connection timeout')
      repositoryMock.findById.mockRejectedValue(connectionError)

      // Act & Assert
      await expect(movieService.findById(validMovieUID.value)).rejects.toThrow(connectionError)
    })

    it('deve lidar com falha de conexão do repositório em operações de atualização', async () => {
      // Arrange
      const connectionError = new Error('Connection timeout')
      repositoryMock.findById.mockResolvedValue(movieMock)
      movieMock.toArchive.mockReturnValue(success(movieMock))
      repositoryMock.update.mockRejectedValue(connectionError)

      // Act & Assert
      await expect(movieService.archive(validMovieUID.value)).rejects.toThrow(connectionError)
    })
  })
})
