import { FailureMessageProvider } from './failure.message.provider';

jest.mock('./failure.messages.json', () => ({
  'TEST_ERROR': {
    message: {
      pt: 'Erro de teste',
      en: 'Test error'
    },
    statusCode: 400
  },
  'NOT_FOUND': {
    message: {
      pt: 'Recurso não encontrado',
      en: 'Resource not found'
    },
    statusCode: 404
  }
}), { virtual: true });

describe('FailureMessageProvider', () => {
  let provider: FailureMessageProvider;

  beforeEach(async () => {
    (FailureMessageProvider as any).instance = null;
    provider = FailureMessageProvider.getInstance();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should return the same instance when getInstance is called multiple times', () => {
    // Arrange
    const instance1 = FailureMessageProvider.getInstance();
    const instance2 = FailureMessageProvider.getInstance();

    // Assert
    expect(instance1).toBe(instance2);
  });

  it('should load messages from JSON file', () => {
    // Act
    const testErrorConfig = provider.getMessageConfig('TEST_ERROR');

    // Assert
    expect(testErrorConfig).toBeDefined();
    expect(testErrorConfig?.message.pt).toBe('Erro de teste');
    expect(testErrorConfig?.message.en).toBe('Test error');
    expect(testErrorConfig?.statusCode).toBe(400);
  });

  it('should return undefined for non-existent error codes', () => {
    // Act
    const nonExistentConfig = provider.getMessageConfig('NON_EXISTENT_CODE');

    // Assert
    expect(nonExistentConfig).toBeUndefined();
  });

  it('should return correct message config for existing error code', () => {
    // Act
    const notFoundConfig = provider.getMessageConfig('NOT_FOUND');

    // Assert
    expect(notFoundConfig).toBeDefined();
    expect(notFoundConfig?.message.pt).toBe('Recurso não encontrado');
    expect(notFoundConfig?.message.en).toBe('Resource not found');
    expect(notFoundConfig?.statusCode).toBe(404);
  });
});