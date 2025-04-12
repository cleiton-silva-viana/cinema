import { HttpStatus } from '@nestjs/common';
import { SimpleFailure } from './simple.failure.type';
import { FailureMapper } from './failure.mapper';
import { FailureMessageConfig } from './failure.message.provider';
import { IFailureMessageProvider } from './failure.message.provider.interface';

const ERROR_CODES = {
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_UUID_FORMAT: 'INVALID_UUID_FORMAT',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  UNKNOWN_ERROR_CODE: 'UNKNOWN_ERROR_CODE',
  CUSTOM_ERROR_CODE: 'CUSTOM_ERROR_CODE',
  ENGLISH_ONLY_ERROR: 'ENGLISH_ONLY_ERROR'
};

const ERROR_MESSAGES = {
  RESOURCE_NOT_FOUND: {
    pt: 'O recurso solicitado não foi encontrado.',
    en: 'The requested resource was not found.'
  },
  VALIDATION_ERROR: {
    pt: 'Os dados fornecidos falharam na validação.',
    en: 'The provided data failed validation. Please check your input and try again.'
  },
  INVALID_UUID_FORMAT: {
    pt: 'O formato do UUID é inválido.',
    en: 'Invalid UUID format.'
  },
  UNAUTHORIZED_ACCESS: {
    pt: 'Acesso não autorizado.',
    en: 'Unauthorized access.'
  },
  ENGLISH_ONLY_ERROR: {
    en: 'English only message'
  }
};

describe('FailureMapper', () => {
  const mockMessageProvider: IFailureMessageProvider = {
    getMessageConfig: jest.fn().mockImplementation((code: string): FailureMessageConfig | undefined => {
      const mockMessages: Record<string, FailureMessageConfig> = {
        [ERROR_CODES.RESOURCE_NOT_FOUND]: {
          message: ERROR_MESSAGES.RESOURCE_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND
        },
        [ERROR_CODES.VALIDATION_ERROR]: {
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          statusCode: HttpStatus.BAD_REQUEST
        },
        [ERROR_CODES.INVALID_UUID_FORMAT]: {
          message: ERROR_MESSAGES.INVALID_UUID_FORMAT,
          statusCode: HttpStatus.BAD_REQUEST
        },
        [ERROR_CODES.UNAUTHORIZED_ACCESS]: {
          message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
          statusCode: HttpStatus.UNAUTHORIZED
        }
      };
      
      return mockMessages[code];
    })
  };

  let mapper: FailureMapper;

  beforeEach(() => {
    FailureMapper.setMessageProvider(mockMessageProvider);
    mapper = FailureMapper.getInstance();
  });

  afterEach(() => {
    FailureMapper.reset();
    jest.clearAllMocks();
  });

  it('should convert a SimpleFailure to RichFailureType with correct structure', () => {
    // Arrange
    const simpleFailure: SimpleFailure = {
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      details: {
        field: 'customer',
        value: '123'
      }
    };

    // Act
    const richFailure = mapper.toRichFailure(simpleFailure);

    // Assert
    expect(mockMessageProvider.getMessageConfig).toHaveBeenCalledWith(ERROR_CODES.RESOURCE_NOT_FOUND);
    expect(richFailure).toHaveProperty('code', simpleFailure.code);
    expect(richFailure).toHaveProperty('status', HttpStatus.NOT_FOUND);
    expect(richFailure).toHaveProperty('title', ERROR_MESSAGES.RESOURCE_NOT_FOUND.pt);
    expect(richFailure.details).toEqual(simpleFailure.details);
  });

  it('should respect language parameter when converting failures', () => {
    // Arrange
    const simpleFailure: SimpleFailure = {
      code: ERROR_CODES.VALIDATION_ERROR,
      details: { field: 'email' }
    };

    // Act
    const ptFailure = mapper.toRichFailure(simpleFailure, 'pt');
    const enFailure = mapper.toRichFailure(simpleFailure, 'en');

    // Assert
    expect(mockMessageProvider.getMessageConfig).toHaveBeenCalledWith(ERROR_CODES.VALIDATION_ERROR);
    expect(ptFailure.title).toBe(ERROR_MESSAGES.VALIDATION_ERROR.pt);
    expect(enFailure.title).toBe(ERROR_MESSAGES.VALIDATION_ERROR.en);
  });

  it('should provide a default status and title for unknown error codes', () => {
    // Arrange
    const simpleFailure: SimpleFailure = {
      code: ERROR_CODES.UNKNOWN_ERROR_CODE,
      details: { reason: 'Something went wrong' }
    };

    // Act
    const richFailure = mapper.toRichFailure(simpleFailure);

    // Assert
    expect(mockMessageProvider.getMessageConfig).toHaveBeenCalledWith(ERROR_CODES.UNKNOWN_ERROR_CODE);
    expect(richFailure.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(richFailure.title).toContain('Erro não catalogado');
    expect(richFailure.details).toEqual(simpleFailure.details);
  });

  it('should preserve the original failure code in the rich failure', () => {
    // Arrange
    const simpleFailure: SimpleFailure = {
      code: ERROR_CODES.CUSTOM_ERROR_CODE,
      details: { custom: 'data' }
    };

    // Act
    const richFailure = mapper.toRichFailure(simpleFailure);

    // Assert
    expect(richFailure.code).toBe(simpleFailure.code);
  });

  it('should convert multiple failures while preserving their individual properties', () => {
    // Arrange
    const failures: SimpleFailure[] = [
      {
        code: ERROR_CODES.INVALID_UUID_FORMAT,
        details: { resource: 'customer' }
      },
      {
        code: ERROR_CODES.UNAUTHORIZED_ACCESS
      }
    ];

    // Act
    const richFailures = mapper.toRichFailures(failures);

    // Assert
    expect(richFailures).toHaveLength(2);
    expect(richFailures[0].code).toBe(failures[0].code);
    expect(richFailures[1].code).toBe(failures[1].code);
    expect(richFailures[0].status).toBe(HttpStatus.BAD_REQUEST);
    expect(richFailures[1].status).toBe(HttpStatus.UNAUTHORIZED);
    expect(mockMessageProvider.getMessageConfig).toHaveBeenCalledTimes(2);
  });

  it('should handle null or undefined details in SimpleFailure', () => {
    // Arrange
    const simpleFailure: SimpleFailure = {
      code: ERROR_CODES.UNAUTHORIZED_ACCESS
      // No details provided
    };

    // Act
    const richFailure = mapper.toRichFailure(simpleFailure);

    // Assert
    expect(richFailure.code).toBe(simpleFailure.code);
    expect(richFailure.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(richFailure.details).toEqual({});
  });

  it('should handle complex detail values by converting them to strings', () => {
    // Arrange
    const simpleFailure: SimpleFailure = {
      code: ERROR_CODES.VALIDATION_ERROR,
      details: {
        field: 'items',
        value: [1, 2, 3],
        object: { key: 'value' }
      }
    };

    // Act
    const richFailure = mapper.toRichFailure(simpleFailure);

    // Assert
    expect(richFailure.details).toBeDefined();
    expect(richFailure.details.field).toBe('items');
    expect(typeof richFailure.details.value).toBe('string');
    expect(richFailure.details.value).toBe('1,2,3');
    expect(typeof richFailure.details.object).toBe('string');
    expect(richFailure.details.object).toBe('[object Object]');
  });

  it('should return an empty array when converting an empty array of failures', () => {
    // Act
    const richFailures = mapper.toRichFailures([]);

    // Assert
    expect(richFailures).toEqual([]);
    expect(mockMessageProvider.getMessageConfig).not.toHaveBeenCalled();
  });

  it('should use English message as fallback when requested language is not available', () => {
    // Arrange
    // Mock a message config with only English
    (mockMessageProvider.getMessageConfig as jest.Mock).mockReturnValueOnce({
      message: ERROR_MESSAGES.ENGLISH_ONLY_ERROR,
      statusCode: HttpStatus.BAD_REQUEST
    });
    
    const simpleFailure: SimpleFailure = {
      code: ERROR_CODES.ENGLISH_ONLY_ERROR
    };

    // Act
    const ptFailure = mapper.toRichFailure(simpleFailure, 'pt');

    // Assert
    expect(ptFailure.title).toBe(ERROR_MESSAGES.ENGLISH_ONLY_ERROR.en);
  });
});