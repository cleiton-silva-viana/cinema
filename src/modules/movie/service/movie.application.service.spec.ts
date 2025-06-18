import { Test, TestingModule } from '@nestjs/testing'
import { IMovieRepository, IMovieWithRelations } from '../repository/movie.repository.interface'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { MovieApplicationService } from '@modules/movie/service/movie.application.service'
import { MOVIE_REPOSITORY } from '@modules/movie/constant/movie.constant'
import { CloneTestMovieWithOverrides, CreateTestMovie, CreateTestMovieWithRelations } from '@test/builder/movie.builder'
import { CreateTestContributorInput } from '@test/builder/contributor.builder'
import { IMovieFilterInput, MovieFilter } from '@modules/movie/entity/value-object/movie.filter'
import { ICreateMovieInput, Movie } from '@modules/movie/entity/movie'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { failure, success } from '@/shared/result/result'
import { DateHelper } from '@shared/helper/date.helper'
import { ImageUID } from '@modules/image/entity/value-object/image.uid'
import { CreateMultilingualTextContent } from '@test/builder/muiltilignual.content.builder'
import { AgeRating } from '@modules/movie/type/age.rating'
import { MovieAdministrativeStatusEnum } from '@modules/movie/type/movie.administrative.status'
import { ILanguageContent } from '@/shared/value-object/language-content/language.content.interface'
import { SupportedLanguageEnum } from '@shared/value-object/language-content/supported.language.enum'
import { faker } from '@faker-js/faker'

describe('MovieApplicationService - Testes de Integração', () => {
  const mockError = new Error('error para testes')
  const mockMovie = CreateTestMovie()
  const mockSimpleFailure: SimpleFailure = { code: FailureCode.INVALID_ENUM_VALUE }
  const mockFilterInstance = {
    genre: ['ACTION'],
    ageRating: 'L',
    dateRange: {
      startDate: DateHelper.soon(1),
      endDate: DateHelper.soon(7),
    },
  } as unknown as MovieFilter
  const mockFilterInput = { ...mockFilterInstance } as unknown as IMovieFilterInput

  let movieService: MovieApplicationService
  let repositoryMock: jest.Mocked<IMovieRepository>
  let module: TestingModule

  beforeEach(async () => {
    repositoryMock = {
      findById: jest.fn(),
      findByIdWithRelations: jest.fn(),
      findMany: jest.fn(),
      findManyWithRelations: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IMovieRepository>

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
      repositoryMock.findById.mockResolvedValue(mockMovie)

      // Act
      const result = await movieService.findById(mockMovie.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(result).toBeValidResultWithValue(mockMovie)
    })

    it('deve retornar falha quando UID for inválido', async () => {
      // Arrange
      const invalidUID = 'uid-inválido'

      // Act
      const result = await movieService.findById(invalidUID)

      // Assert
      expect(repositoryMock.findById).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.UID_WITH_INVALID_FORMAT)
    })

    it('deve retornar falha quando filme não existir', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await movieService.findById(mockMovie.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve propagar erro do repositório', async () => {
      // Arrange
      repositoryMock.findById.mockRejectedValue(mockError)

      // Act & Assert
      await expect(movieService.findById(mockMovie.uid.value)).rejects.toThrow(mockError)

      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
    })
  })

  describe('findByIdWithRelations', () => {
    it('deve retornar filme com relacionamentos quando encontrado', async () => {
      // Arrange
      const movieWithRelations = CreateTestMovieWithRelations({
        contributos: [CreateTestContributorInput(), CreateTestContributorInput()],
      })
      repositoryMock.findByIdWithRelations.mockResolvedValue(movieWithRelations)

      // Act
      const result = await movieService.findByIdWithRelations(mockMovie.uid.value)

      // Assert
      expect(repositoryMock.findByIdWithRelations).toHaveBeenCalledWith(mockMovie.uid)
      expect(result).toBeValidResultWithValue(movieWithRelations)
      expect(result).toBeValidResultMatching<IMovieWithRelations>((m) => {
        expect(m.movie).toBeDefined()
        expect(m.image).toBeDefined()
        expect(m.contributors).toHaveLength(2)
      })
    })

    it('deve retornar failure quando UID for inválido', async () => {
      // Arrange
      const invalidUID = 'uid-invalido'

      // Act
      const result = await movieService.findByIdWithRelations(invalidUID)

      // Assert
      expect(repositoryMock.findByIdWithRelations).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.UID_WITH_INVALID_FORMAT)
    })

    it('deve retornar failure quando filme não existir', async () => {
      // Arrange
      repositoryMock.findByIdWithRelations.mockResolvedValue(null)

      // Act
      const result = await movieService.findByIdWithRelations(mockMovie.uid.value)

      // Assert
      expect(repositoryMock.findByIdWithRelations).toHaveBeenCalledWith(mockMovie.uid)
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve propagar erro do repositório', async () => {
      // Arrange
      repositoryMock.findByIdWithRelations.mockRejectedValue(mockError)

      // Act & Assert
      await expect(movieService.findByIdWithRelations(mockMovie.uid.value)).rejects.toThrow(mockError)
    })
  })

  describe('findMany', () => {
    it('deve retornar lista de filmes quando filtros são válidos', async () => {
      // Arrange
      const mockMovies = [CreateTestMovie(), CreateTestMovie()]
      jest.spyOn(MovieFilter, 'create').mockReturnValue(success(mockFilterInstance))
      repositoryMock.findMany.mockResolvedValue(mockMovies)

      // Act
      const result = await movieService.findMany(mockFilterInput)

      // Assert
      expect(repositoryMock.findMany).toHaveBeenCalledWith(mockFilterInstance)
      expect(MovieFilter.create).toHaveBeenCalledWith(mockFilterInput)
      expect(result).toBeValidResultMatching<Movie[]>((m) => {
        expect(m).toHaveLength(2)
        expect(m).toEqual(mockMovies)
      })
    })

    it('deve retornar lista vazia quando nenhum filme corresponder aos filtros', async () => {
      // Arrange
      jest.spyOn(MovieFilter, 'create').mockReturnValue(success(mockFilterInstance))
      repositoryMock.findMany.mockResolvedValue([])

      // Act
      const result = await movieService.findMany(mockFilterInput)

      // Assert
      expect(MovieFilter.create).toHaveBeenCalledWith(mockFilterInput)
      expect(repositoryMock.findMany).toHaveBeenCalledWith(mockFilterInstance)
      expect(result).toBeValidResultMatching<Movie[]>((m) => {
        expect(m).toHaveLength(0)
      })
    })

    it('deve retornar failure quando validação dos filtros falhar', async () => {
      // Arrange
      jest.spyOn(MovieFilter, 'create').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.findMany(mockFilterInput)

      // Assert
      expect(repositoryMock.findMany).not.toHaveBeenCalled()
      expect(MovieFilter.create).toHaveBeenCalledWith(mockFilterInput)
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve propagar erro n o repositório', () => {
      // Arrange
      jest.spyOn(MovieFilter, 'create').mockReturnValue(success(mockFilterInstance))
      repositoryMock.findMany.mockRejectedValue(mockError)

      // Act & assert
      expect(() => movieService.findMany(mockFilterInput)).rejects.toThrow(mockError)
      expect(MovieFilter.create).toHaveBeenCalledWith(mockFilterInput)
    })
  })

  describe('findManyWithRelations', () => {
    it('deve retornar lista de filmes com relacionamentos', async () => {
      // Arrange
      const mockMoviesWithRelations = [CreateTestMovieWithRelations({ contributos: [CreateTestContributorInput()] })]
      repositoryMock.findManyWithRelations.mockResolvedValue(mockMoviesWithRelations)
      jest.spyOn(MovieFilter, 'create').mockReturnValue(success(mockFilterInstance))

      // Act
      const result = await movieService.findManyWithRelations(mockFilterInput)

      // Assert
      expect(MovieFilter.create).toHaveBeenCalledWith(mockFilterInput)
      expect(repositoryMock.findManyWithRelations).toHaveBeenCalledWith(mockFilterInstance)
      expect(result).toBeValidResultMatching<IMovieWithRelations[]>((m) => {
        expect(m).toEqual(mockMoviesWithRelations)
      })
    })

    it('deve retornar lista vazia quando nenhum filme com relacionamentos corresponder', async () => {
      // Arrange
      repositoryMock.findManyWithRelations.mockResolvedValue([])
      jest.spyOn(MovieFilter, 'create').mockReturnValue(success(mockFilterInstance))

      // Act
      const result = await movieService.findManyWithRelations(mockFilterInput)

      // Assert
      expect(MovieFilter.create).toHaveBeenCalledWith(mockFilterInput)
      expect(repositoryMock.findManyWithRelations).toBeCalledWith(mockFilterInstance)
      expect(result).toBeValidResultMatching<Array<IMovieWithRelations>>((arr) => arr.length === 0)
    })

    it('deve retornar failure quando validação dos filtros falhar', async () => {
      // Arrange
      jest.spyOn(MovieFilter, 'create').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.findManyWithRelations(mockFilterInput)

      // Assert
      expect(MovieFilter.create).toHaveBeenCalledWith(mockFilterInput)
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve propagar erro do repositório', async () => {
      // Arrange
      jest.spyOn(MovieFilter, 'create').mockReturnValue(success(mockFilterInstance))
      repositoryMock.findManyWithRelations.mockRejectedValue(mockError)

      // Act & Assert
      await expect(movieService.findManyWithRelations(mockFilterInput)).rejects.toThrow(mockError)
      expect(MovieFilter.create).toHaveBeenCalledWith(mockFilterInput)
    })
  })

  describe('create', () => {
    const input: ICreateMovieInput = {
      imageUID: ImageUID.create().value,
      title: CreateMultilingualTextContent(),
      description: CreateMultilingualTextContent(),
      ageRating: AgeRating.L,
      contributors: [CreateTestContributorInput(), CreateTestContributorInput()],
      durationInMinutes: 120,
    }

    it('deve criar filme com sucesso quando dados são válidos', async () => {
      // Arrange
      jest.spyOn(Movie, 'create').mockReturnValue(success(mockMovie))
      repositoryMock.save.mockResolvedValue(mockMovie)

      // Act
      const result = await movieService.create(input)

      // Assert
      expect(Movie.create).toHaveBeenCalledWith(input)
      expect(repositoryMock.save).toHaveBeenCalledWith(mockMovie)
      expect(result).toBeValidResultWithValue(mockMovie)
    })

    it('deve retornar falha quando inputs forem inválidos', async () => {
      // Arrange
      jest.spyOn(Movie, 'create').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.create(input)

      // Assert
      expect(Movie.create).toHaveBeenCalledWith(input)
      expect(repositoryMock.save).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve retornar falha quando parâmetros obrigatórios são nulos ou indefinidos', async () => {
      // Act
      const result = await movieService.create(null as any)

      // Assert
      expect(repositoryMock.save).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.MISSING_REQUIRED_DATA)
    })

    it('deve propagar erro do repositório durante save', async () => {
      // Arrange
      jest.spyOn(Movie, 'create').mockReturnValue(success(mockMovie))
      repositoryMock.save.mockRejectedValue(mockError)

      // Act & Assert
      await expect(movieService.create({} as any)).rejects.toThrow(mockError)
    })
  })

  describe('submitForReview', () => {
    it('deve enviar filme para revisão com sucesso', async () => {
      // Arrange
      const pendingReviewMovie = CloneTestMovieWithOverrides(mockMovie, {
        status: MovieAdministrativeStatusEnum.PENDING_REVIEW,
      })
      const savedMovieInRepository = CloneTestMovieWithOverrides(pendingReviewMovie, {})
      repositoryMock.findById.mockResolvedValue(mockMovie) // status = DRAFT por padrão
      jest.spyOn(mockMovie, 'toPendingReview').mockReturnValue(success(pendingReviewMovie))
      repositoryMock.update.mockResolvedValue(savedMovieInRepository) // espera-se que retorne um objeto igual ao enviado...

      // Act
      const result = await movieService.submitForReview(mockMovie.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.toPendingReview).toHaveBeenCalled()
      expect(repositoryMock.update).toHaveBeenCalledWith(pendingReviewMovie)
      expect(result).toBeValidResultWithValue(savedMovieInRepository) // deve retornar uma instância de objeto semelhante...
    })

    it('deve retornar falha quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await movieService.submitForReview(mockMovie.uid.value)

      // Assert
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve retornar falha quando transição de estado falhar', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'toPendingReview').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.submitForReview(mockMovie.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve propagar erro do repositório durante update', async () => {
      // Arrange
      const mockUpdatedMovie = CloneTestMovieWithOverrides(mockMovie, {
        status: MovieAdministrativeStatusEnum.PENDING_REVIEW,
      })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'toPendingReview').mockReturnValue(success(mockUpdatedMovie))
      repositoryMock.update.mockRejectedValue(mockError)

      // Act & Assert
      await expect(movieService.submitForReview(mockMovie.uid.value)).rejects.toThrow(mockError)
    })
  })

  describe('toApprove', () => {
    it('deve aprovar filme com sucesso', async () => {
      // Arrange
      const approvedMovie = CloneTestMovieWithOverrides(mockMovie, { status: MovieAdministrativeStatusEnum.APPROVED })
      const mockUpdatedMovieRepository = CloneTestMovieWithOverrides(approvedMovie, {})
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'toApprove').mockReturnValue(success(approvedMovie))
      repositoryMock.update.mockResolvedValue(mockUpdatedMovieRepository)

      // Act
      const result = await movieService.approve(mockMovie.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.toApprove).toHaveBeenCalled()
      expect(repositoryMock.update).toHaveBeenCalledWith(approvedMovie)
      expect(result).toBeValidResultWithValue(mockUpdatedMovieRepository)
    })

    it('deve retornar falha quando aprovação falhar por regras de negócio', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'toApprove').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.approve(mockMovie.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve retornar falha quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await movieService.approve(mockMovie.uid.value)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve propagar erros lançados no repositório', async () => {
      // Arrange
      const approvedMovie = CloneTestMovieWithOverrides(mockMovie, { status: MovieAdministrativeStatusEnum.APPROVED })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'toApprove').mockReturnValue(success(approvedMovie))
      repositoryMock.update.mockRejectedValue(mockError)

      // Act & Assert
      await expect(() => movieService.approve(mockMovie.uid.value)).rejects.toThrow(mockError)
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
    })
  })

  describe('toArchive', () => {
    it('deve arquivar filme com sucesso', async () => {
      // Arrange
      const archivedMovie = CloneTestMovieWithOverrides(mockMovie, { status: MovieAdministrativeStatusEnum.ARCHIVED })
      const archivedMovieRepository = CloneTestMovieWithOverrides(archivedMovie, {})
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'toArchive').mockReturnValue(success(archivedMovie))
      repositoryMock.update.mockResolvedValue(archivedMovieRepository)

      // Act
      const result = await movieService.archive(mockMovie.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.toArchive).toHaveBeenCalled()
      expect(repositoryMock.update).toHaveBeenCalledWith(archivedMovie)
      expect(result).toBeValidResultWithValue(archivedMovieRepository)
    })

    it('deve retornar falha quando arquivamento falhar', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'toArchive').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.archive(mockMovie.uid.value)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.toArchive).toHaveBeenCalled()
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve retornar falha quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await movieService.archive(mockMovie.uid.value)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve propagar erros', async () => {
      // Arrange
      const archivedMovie = CloneTestMovieWithOverrides(mockMovie, { status: MovieAdministrativeStatusEnum.ARCHIVED })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'toArchive').mockReturnValue(success(archivedMovie))
      repositoryMock.update.mockRejectedValue(mockError)

      // Act & Assert
      await expect(() => movieService.archive(mockMovie.uid.value)).rejects.toThrow(mockError)
    })
  })

  describe('updateTitle', () => {
    const mockNewTitle: ILanguageContent = {
      text: 'New Movie Title for Testing',
      language: SupportedLanguageEnum.EN,
    }
    const newTitle = CreateMultilingualTextContent()

    it('deve atualizar título com sucesso', async () => {
      // Arrange
      const updatedMovie = CreateTestMovie({ title: mockNewTitle })
      const updatedMovieRepository = CreateTestMovie({ title: mockNewTitle })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateTitle').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovieRepository)

      // Act
      const result = await movieService.updateTitle(mockMovie.uid.value, newTitle)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.updateTitle).toHaveBeenCalledWith(newTitle)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
      expect(result).toBeValidResultWithValue(updatedMovieRepository)
    })

    it('deve retornar failure quando título for inválido', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateTitle').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.updateTitle(mockMovie.uid.value, newTitle)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.updateTitle).toHaveBeenCalledWith(newTitle)
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve propagar erro', async () => {
      // Arrange
      const updatedMovie = CreateTestMovie({ title: mockNewTitle })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateTitle').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockRejectedValue(mockError)

      // Act & Assert
      await expect(() => movieService.updateTitle(mockMovie.uid.value, newTitle)).rejects.toThrow(mockError)
    })
  })

  describe('updateDescription', () => {
    const mockNewDescription: ILanguageContent = {
      text: faker.lorem.words(15),
      language: SupportedLanguageEnum.EN,
    }
    const newDescription = CreateMultilingualTextContent()

    it('deve atualizar a descrição com sucesso', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { description: mockNewDescription })
      const updatedMovieRepository = CloneTestMovieWithOverrides(mockMovie, {})
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateDescription').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovieRepository)

      // Act
      const result = await movieService.updateDescription(mockMovie.uid.value, newDescription)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.updateDescription).toHaveBeenCalledWith(newDescription)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
      expect(result).toBeValidResultWithValue(updatedMovieRepository)
    })

    it('deve retornar failure quando Movie.updateDescription falhar', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateDescription').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.updateDescription(mockMovie.uid.value, newDescription)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve propagar erro', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { description: mockNewDescription })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateDescription').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockRejectedValue(mockError)

      // Act & Assert
      await expect(() => movieService.updateDescription(mockMovie.uid.value, newDescription)).rejects.toThrow(mockError)
    })
  })

  describe('setDuration', () => {
    const newDuration = 180

    it('deve definir duração com sucesso', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { duration: newDuration })
      const updatedMovieRepository = CloneTestMovieWithOverrides(updatedMovie, {})
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'setDuration').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovieRepository)

      // Act
      const result = await movieService.setDuration(mockMovie.uid.value, newDuration)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.setDuration).toHaveBeenCalledWith(newDuration)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
      expect(result).toBeValidResultWithValue(updatedMovieRepository)
    })

    it('deve retornar falha quando duração for inválida', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'setDuration').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.setDuration(mockMovie.uid.value, newDuration)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.setDuration).toHaveBeenCalledWith(newDuration)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve retornar falha quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await movieService.setDuration(mockMovie.uid.value, newDuration)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve propagar erro', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { duration: newDuration })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'setDuration').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockRejectedValue(mockError)

      // Act & Assert
      await expect(() => movieService.setDuration(mockMovie.uid.value, newDuration)).rejects.toThrow(mockError)
    })
  })

  describe('setDisplayPeriod', () => {
    const startDate = DateHelper.soon(1)
    const endDate = DateHelper.soon(30)

    it('deve definir período de exibição com sucesso', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { displayPeriod: { startDate, endDate } })
      const updatedMovieRepository = CloneTestMovieWithOverrides(updatedMovie, {})
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'setDisplayPeriod').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovieRepository)

      // Act
      const result = await movieService.setDisplayPeriod(mockMovie.uid.value, startDate, endDate)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.setDisplayPeriod).toHaveBeenCalledWith(startDate, endDate)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
      expect(result).toBeValidResultWithValue(updatedMovieRepository)
    })

    it('deve retornar falha quando período for inválido', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'setDisplayPeriod').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.setDisplayPeriod(mockMovie.uid.value, startDate, endDate)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.setDisplayPeriod).toHaveBeenCalledWith(startDate, endDate)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve retornar falha quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await movieService.setDisplayPeriod(mockMovie.uid.value, startDate, endDate)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve propagar erro', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { displayPeriod: { startDate, endDate } })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'setDisplayPeriod').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockRejectedValue(mockError)

      // Act & Assert
      await expect(() => movieService.setDisplayPeriod(mockMovie.uid.value, startDate, endDate)).rejects.toThrow(
        mockError
      )
    })
  })

  describe('updateAgeRating', () => {
    const newAgeRating = AgeRating.Twelve

    it('deve atualizar classificação etária com sucesso', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { ageRating: newAgeRating })
      const updatedMovieRepository = CloneTestMovieWithOverrides(updatedMovie, {})
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateAgeRating').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovieRepository)

      // Act
      const result = await movieService.updateAgeRating(mockMovie.uid.value, newAgeRating)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.updateAgeRating).toHaveBeenCalledWith(newAgeRating)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
      expect(result).toBeValidResultWithValue(updatedMovieRepository)
    })

    it('deve retornar failure quando classificação etária for inválida', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateAgeRating').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.updateAgeRating(mockMovie.uid.value, newAgeRating)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.updateAgeRating).toHaveBeenCalledWith(newAgeRating)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve retornar falha quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await movieService.updateAgeRating(mockMovie.uid.value, newAgeRating)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve propagar erro', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { ageRating: newAgeRating })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateAgeRating').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockRejectedValue(mockError)

      // Act & Assert
      await expect(() => movieService.updateAgeRating(mockMovie.uid.value, newAgeRating)).rejects.toThrow(mockError)
    })
  })

  describe('setGenres', () => {
    const newGenres = ['ACTION', 'COMEDY']

    it('deve definir gêneros com sucesso', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { genres: newGenres })
      const updatedMovieRepository = CloneTestMovieWithOverrides(updatedMovie, {})
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'setGenres').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovieRepository)

      // Act
      const result = await movieService.setGenres(mockMovie.uid.value, newGenres)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.setGenres).toHaveBeenCalledWith(newGenres)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
      expect(result).toBeValidResultWithValue(updatedMovieRepository)
    })

    it('deve retornar failure quando gêneros forem inválidos', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'setGenres').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.setGenres(mockMovie.uid.value, newGenres)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.setGenres).toHaveBeenCalledWith(newGenres)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve retornar falha quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await movieService.setGenres(mockMovie.uid.value, newGenres)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve propagar erro', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { genres: newGenres })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'setGenres').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockRejectedValue(mockError)

      // Act & Assert
      await expect(() => movieService.setGenres(mockMovie.uid.value, newGenres)).rejects.toThrow(mockError)
    })
  })

  describe('updatePosterImage', () => {
    const newImageUID = ImageUID.create().value

    it('deve atualizar imagem do poster com sucesso', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { imageUID: newImageUID })
      const updatedMovieRepository = CloneTestMovieWithOverrides(updatedMovie, {})
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updatePosterImage').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovieRepository)

      // Act
      const result = await movieService.updatePosterImage(mockMovie.uid.value, newImageUID)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.updatePosterImage).toHaveBeenCalledWith(newImageUID)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
      expect(result).toBeValidResultWithValue(updatedMovieRepository)
    })

    it('deve retornar failure quando UID da imagem for inválido', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updatePosterImage').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.updatePosterImage(mockMovie.uid.value, newImageUID)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.updatePosterImage).toHaveBeenCalledWith(newImageUID)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve retornar falha quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await movieService.updatePosterImage(mockMovie.uid.value, newImageUID)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve propagar erro', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { imageUID: newImageUID })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updatePosterImage').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockRejectedValue(mockError)

      // Act & Assert
      await expect(() => movieService.updatePosterImage(mockMovie.uid.value, newImageUID)).rejects.toThrow(mockError)
    })
  })

  describe('updateContributors', () => {
    const newContributors = [CreateTestContributorInput(), CreateTestContributorInput()]

    it('deve atualizar contribuidores com sucesso', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { contributors: newContributors })
      const updatedMovieRepository = CloneTestMovieWithOverrides(updatedMovie, {})
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateContributors').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockResolvedValue(updatedMovieRepository)

      // Act
      const result = await movieService.updateContributors(mockMovie.uid.value, newContributors)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.updateContributors).toHaveBeenCalledWith(newContributors)
      expect(repositoryMock.update).toHaveBeenCalledWith(updatedMovie)
      expect(result).toBeValidResultWithValue(updatedMovieRepository)
    })

    it('deve retornar failure quando contribuidores forem inválidos', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateContributors').mockReturnValue(failure(mockSimpleFailure))

      // Act
      const result = await movieService.updateContributors(mockMovie.uid.value, newContributors)

      // Assert
      expect(repositoryMock.findById).toHaveBeenCalledWith(mockMovie.uid)
      expect(mockMovie.updateContributors).toHaveBeenCalledWith(newContributors)
      expect(repositoryMock.update).not.toHaveBeenCalled()
      expect(result).toBeInvalidResultWithFailure(mockSimpleFailure)
    })

    it('deve retornar falha quando filme não for encontrado', async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null)

      // Act
      const result = await movieService.updateContributors(mockMovie.uid.value, newContributors)

      // Assert
      expect(result).toBeInvalidResultWithSingleFailure(FailureCode.RESOURCE_NOT_FOUND)
    })

    it('deve propagar erro', async () => {
      // Arrange
      const updatedMovie = CloneTestMovieWithOverrides(mockMovie, { contributors: newContributors })
      repositoryMock.findById.mockResolvedValue(mockMovie)
      jest.spyOn(mockMovie, 'updateContributors').mockReturnValue(success(updatedMovie))
      repositoryMock.update.mockRejectedValue(mockError)

      // Act & Assert
      await expect(() => movieService.updateContributors(mockMovie.uid.value, newContributors)).rejects.toThrow(
        mockError
      )
    })
  })
})
