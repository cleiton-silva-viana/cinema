import { MovieService } from "./movie.service";
import { IMovieRepository } from "../repository/movie.repository.interface";
import { IShowtimeService } from "../../showtime/service/showtime.service.interface";
import { MovieUID } from "../entity/value-object/movie.uid";
import { ICreateMovieInput, Movie } from "../entity/movie";
import { failure, success } from "../../../shared/result/result";
import {
  IMovieFilterInput,
  MovieFilter,
} from "../entity/value-object/movie.filter";
import { FailureCode } from "../../../shared/failure/failure.codes.enum";
import { v7 } from "uuid";

describe("MovieService", () => {
  let movieService: MovieService;
  let repositoryMock: jest.Mocked<IMovieRepository>;
  let showtimeServiceMock: jest.Mocked<IShowtimeService>;
  let movieMock: Movie;
  let validMovieUID: MovieUID;

  beforeEach(() => {
    repositoryMock = {
      findById: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IMovieRepository>;

    showtimeServiceMock = {
      ...jest.requireActual<IShowtimeService>(
        "../../showtime/service/showtime.service.interface",
      ),
      movieHasShowings: jest.fn(),
      movieHasExhibitionsScheduled: jest.fn(),
    } as unknown as jest.Mocked<IShowtimeService>;

    movieService = new MovieService(repositoryMock, showtimeServiceMock);

    validMovieUID = MovieUID.create();
    movieMock = {
      uid: validMovieUID,
      update: jest.fn(),
      toArchive: jest.fn(),
      toApprove: jest.fn(),
      toPendingReview: jest.fn(),
    } as unknown as Movie;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("findById", () => {
    it("deve retornar um filme quando encontrado pelo UID", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(movieMock);

      // Act
      const result = await movieService.findById(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(movieMock);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findById).toHaveBeenCalledWith(validMovieUID);
    });

    it("deve retornar um erro quando uid for inválido", async () => {
      // Act
      const result = await movieService.findById(null);

      // Assert
      expect(result.invalid).toBe(true);
      expect(repositoryMock.findById).not.toHaveBeenCalled();
    });

    it("deve retornar failure quando o filme não existir", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await movieService.findById(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findById).toHaveBeenCalledWith(validMovieUID);
    });
  });

  describe("findMany", () => {
    const filters: IMovieFilterInput = {
      genres: ["ACTION"],
      ageRating: "10",
    };

    it("deve retornar filmes quando os filtros são válidos", async () => {
      // Arrange
      const filterVO = MovieFilter.create(filters); // Criado dentro do teste
      const movies = [movieMock];
      jest.spyOn(MovieFilter, "create").mockReturnValue(filterVO);
      repositoryMock.find.mockResolvedValue(movies);

      // Act
      const result = await movieService.findMany(filters);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(movies);
      expect(MovieFilter.create).toHaveBeenCalledWith(filters);
      expect(repositoryMock.find).toHaveBeenCalledWith(filterVO.value);
    });

    it("deve retornar uma lista vazia quando nenhum filme corresponde aos filtros", async () => {
      // Arrange
      const filterVO = MovieFilter.create(filters); // Criado dentro do teste
      jest.spyOn(MovieFilter, "create").mockReturnValue(filterVO);
      repositoryMock.find.mockResolvedValue([]);

      // Act
      const result = await movieService.findMany(filters);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual([]);
      expect(MovieFilter.create).toHaveBeenCalledWith(filters);
      expect(repositoryMock.find).toHaveBeenCalledWith(filterVO.value);
    });

    it("deve retornar falha quando a validação dos filtros falha", async () => {
      // Arrange
      const fail = [{ code: "INVALID_FILTER" }];
      jest.spyOn(MovieFilter, "create").mockReturnValue(failure(fail));

      // Act
      const result = await movieService.findMany(filters);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(fail);
      expect(repositoryMock.find).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    const createProps: ICreateMovieInput = {
      title: [{ language: "pt", text: "Título do Filme" }],
      description: [{ language: "pt", text: "Descrição do filme" }],
      ageRating: "10",
      imageUID: "IMG." + v7(),
      contributors: [{ personUid: "person-uid", role: "director" }],
    };

    it("should create movie successfully", async () => {
      // Arrange
      jest.spyOn(Movie, "create").mockReturnValue(success(movieMock));
      repositoryMock.save.mockResolvedValue(movieMock);

      // Act
      const result = await movieService.create(createProps);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeDefined();
      expect(result.value).toEqual(movieMock);
      expect(Movie.create).toHaveBeenCalledWith(createProps);
      expect(repositoryMock.save).toHaveBeenCalled();
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledWith(movieMock);
    });

    it("should return failure when input is null", async () => {
      // Act
      const result = await movieService.create(null);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBe(1);
      expect(result.failures[0].code).toBe(FailureCode.MISSING_REQUIRED_DATA);
      expect(repositoryMock.save).not.toHaveBeenCalled();
    });

    it("should return failure when movie validation fails", async () => {
      // Arrange
      const failures = [{ code: "INVALID_TITLE" }];
      jest.spyOn(Movie, "create").mockReturnValue(failure(failures));

      // Act
      const result = await movieService.create(createProps);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(failures);
      expect(repositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const updateProps = {
      title: [{ language: "pt-BR", text: "Título Atualizado" }],
    };

    it("deve atualizar um filme com sucesso", async () => {
      // Arrange
      const updatedMovieMock = {
        ...movieMock,
        title: updateProps.title,
      } as unknown as Movie;

      repositoryMock.findById.mockResolvedValue(movieMock);
      (movieMock.update as jest.Mock).mockReturnValue(
        success(updatedMovieMock),
      );
      repositoryMock.update.mockResolvedValue(updatedMovieMock);

      // Act
      const result = await movieService.update(
        validMovieUID.value,
        updateProps,
      );

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toBeDefined();
      expect(repositoryMock.update).toHaveBeenCalled();
    });

    it("deve retornar uma falha quando não for fornecido nenhum dado para atualização", async () => {
      // Act
      const result = await movieService.update(validMovieUID.value, null);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBe(1);
      expect(result.failures[0].code).toEqual(
        FailureCode.MISSING_REQUIRED_DATA,
      );
    });

    it("should return failure when movie not found", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await movieService.update(
        validMovieUID.value,
        updateProps,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBe(1);
      expect(result.failures[0].code).toEqual(FailureCode.RESOURCE_NOT_FOUND);
    });

    it("deve retornar uma falha quando há as novas propriedades são inválidas", async () => {
      // Arrange
      const failures = [{ code: "INVALID_TITLE" }];
      repositoryMock.findById.mockResolvedValue(movieMock);
      (movieMock.update as jest.Mock).mockReturnValue(failure(failures));

      // Act
      const result = await movieService.update(
        validMovieUID.value,
        updateProps,
      );

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(failures);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("submitForReview", () => {
    it("deve enviar um filme para revisão com sucesso", async () => {
      // Arrange
      const pendingReviewMovieMock = { ...movieMock } as Movie;
      repositoryMock.findById.mockResolvedValue(movieMock);
      (movieMock.toPendingReview as jest.Mock).mockReturnValue(
        success(pendingReviewMovieMock),
      );
      repositoryMock.update.mockResolvedValue(pendingReviewMovieMock);

      // Act
      const result = await movieService.submitForReview(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(pendingReviewMovieMock);
      expect(movieMock.toPendingReview).toHaveBeenCalled();
      expect(repositoryMock.update).toHaveBeenCalledWith(
        pendingReviewMovieMock,
      );
    });

    it("deve retornar falha quando o filme não for encontrado", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await movieService.submitForReview(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(movieMock.toPendingReview).not.toHaveBeenCalled();
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando o UID do filme for inválido", async () => {
      // Arrange
      const invalidUid = "invalid-uid";
      const fail = [{ code: "INVALID_UUID" }];
      jest.spyOn(MovieUID, "parse").mockReturnValue(failure(fail));

      // Act
      const result = await movieService.submitForReview(invalidUid);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(fail);
      expect(repositoryMock.findById).not.toHaveBeenCalled();
      expect(movieMock.toPendingReview).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando o método toPendingReview do filme falhar", async () => {
      // Arrange
      const fail = { code: "PENDING_REVIEW_FAILED" };
      repositoryMock.findById.mockResolvedValue(movieMock);
      (movieMock.toPendingReview as jest.Mock).mockReturnValue(failure(fail));

      // Act
      const result = await movieService.submitForReview(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBe(1);
      expect(result.failures[0].code).toBe(fail.code);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("approve", () => {
    it("deve aprovar um filme com sucesso", async () => {
      // Arrange
      const approvedMovieMock = { ...movieMock } as Movie;
      repositoryMock.findById.mockResolvedValue(movieMock);
      (movieMock.toApprove as jest.Mock).mockReturnValue(
        success(approvedMovieMock),
      );
      repositoryMock.update.mockResolvedValue(approvedMovieMock);

      // Act
      const result = await movieService.approve(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(approvedMovieMock);
      expect(movieMock.toApprove).toHaveBeenCalled();
      expect(repositoryMock.update).toHaveBeenCalledWith(approvedMovieMock);
    });

    it("deve retornar falha quando o filme não for encontrado", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await movieService.approve(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(movieMock.toApprove).not.toHaveBeenCalled();
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando o UID do filme for inválido", async () => {
      // Arrange
      const invalidUid = "invalid-uid";
      const failures = [{ code: "INVALID_UUID" }];
      jest.spyOn(MovieUID, "parse").mockReturnValue(failure(failures));

      // Act
      const result = await movieService.approve(invalidUid);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(failures);
      expect(repositoryMock.findById).not.toHaveBeenCalled();
      expect(movieMock.toApprove).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando o método toApprove do filme falhar", async () => {
      // Arrange
      const fail = { code: "APPROVE_FAILED" };
      repositoryMock.findById.mockResolvedValue(movieMock);
      (movieMock.toApprove as jest.Mock).mockReturnValue(failure(fail));

      // Act
      const result = await movieService.approve(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBe(1);
      expect(result.failures[0].code).toBe(fail.code);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("archive", () => {
    it("deve arquivar um filme com sucesso", async () => {
      // Arrange
      const archivedMovie = { ...movieMock } as Movie;
      repositoryMock.findById.mockResolvedValue(movieMock);
      showtimeServiceMock.movieHasExhibitionsScheduled.mockResolvedValue(
        success(false),
      );
      (movieMock.toArchive as jest.Mock).mockReturnValue(
        success(archivedMovie),
      );
      repositoryMock.update.mockResolvedValue(archivedMovie);

      // Act
      const result = await movieService.archive(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(false);
      expect(result.value).toEqual(archivedMovie);
      expect(movieMock.toArchive).toHaveBeenCalled();
      expect(repositoryMock.update).toHaveBeenCalledWith(archivedMovie);
    });

    it("deve retornar falha quando o filme não for encontrado", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await movieService.archive(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(movieMock.toArchive).not.toHaveBeenCalled();
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando o UID do filme for inválido", async () => {
      // Arrange
      const invalidUid = "invalid-uid";

      // Act
      const result = await movieService.archive(invalidUid);

      // Assert
      expect(result.invalid).toBe(true);
      expect(repositoryMock.findById).not.toHaveBeenCalled();
      expect(movieMock.toArchive).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando o método toArchive do filme falhar", async () => {
      // Arrange
      const fail = { code: "ARCHIVE_FAILED" };
      repositoryMock.findById.mockResolvedValue(movieMock);
      showtimeServiceMock.movieHasExhibitionsScheduled.mockResolvedValue(
        success(false),
      );
      (movieMock.toArchive as jest.Mock).mockReturnValue(failure(fail));

      // Act
      const result = await movieService.archive(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBe(1);
      expect(result.failures[0].code).toBe(fail.code);
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando o filme possuir exibições agendadas", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(movieMock);
      showtimeServiceMock.movieHasExhibitionsScheduled.mockResolvedValue(
        success(true),
      );

      // Act
      const result = await movieService.archive(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(
        FailureCode.MOVIE_ARCHIVE_BLOCKED_BY_SCREENINGS,
      );
      expect(movieMock.toArchive).not.toHaveBeenCalled();
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando a verificação de exibições agendadas falhar", async () => {
      // Arrange
      const fail = { code: "SHOWTIME_CHECK_FAILED" };
      repositoryMock.findById.mockResolvedValue(movieMock);
      showtimeServiceMock.movieHasExhibitionsScheduled.mockResolvedValue(
        failure(fail),
      );

      // Act
      const result = await movieService.archive(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBe(1);
      expect(result.failures[0].code).toBe(fail.code);
      expect(movieMock.toArchive).not.toHaveBeenCalled();
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deve excluir um filme que nunca teve exibições", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(movieMock);
      showtimeServiceMock.movieHasShowings.mockResolvedValue(success(false));
      repositoryMock.delete.mockResolvedValue(true);

      // Act
      const result = await movieService.delete(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(false);
      expect(showtimeServiceMock.movieHasShowings).toHaveBeenCalledWith(
        validMovieUID.value,
      );
      expect(repositoryMock.delete).toHaveBeenCalledWith(validMovieUID);
    });

    it("deve retornar falha quando o filme tiver exibições", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(movieMock);
      showtimeServiceMock.movieHasShowings.mockResolvedValue(success(true));

      // Act
      const result = await movieService.delete(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBe(1);
      expect(result.failures[0].code).toBe(
        FailureCode.MOVIE_DELETE_BLOCKED_BY_SHOWINGS,
      );
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando a verificação de exibições falhar", async () => {
      // Arrange
      const fail = { code: "SHOWTIME_CHECK_ERROR" };
      repositoryMock.findById.mockResolvedValue(movieMock);
      showtimeServiceMock.movieHasShowings.mockResolvedValue(failure(fail));

      // Act
      const result = await movieService.delete(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures.length).toBe(1);
      expect(result.failures[0].code).toBe(fail.code);
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando o filme não for encontrado", async () => {
      // Arrange
      repositoryMock.findById.mockResolvedValue(null);

      // Act
      const result = await movieService.delete(validMovieUID.value);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures[0].code).toBe(FailureCode.RESOURCE_NOT_FOUND);
      expect(showtimeServiceMock.movieHasShowings).not.toHaveBeenCalled();
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });

    it("deve retornar falha quando o UID for inválido", async () => {
      // Arrange
      const invalidUid = "invalid-uid";
      const failures = [{ code: "INVALID_UUID" }];
      jest.spyOn(MovieUID, "parse").mockReturnValue(failure(failures));

      // Act
      const result = await movieService.delete(invalidUid);

      // Assert
      expect(result.invalid).toBe(true);
      expect(result.failures).toEqual(failures);
      expect(repositoryMock.findById).not.toHaveBeenCalled();
      expect(showtimeServiceMock.movieHasShowings).not.toHaveBeenCalled();
    });
  });
});
