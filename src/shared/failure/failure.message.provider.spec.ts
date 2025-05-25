import { FailureMessageProvider } from './failure.message.provider'
import { FailureCode } from './failure.codes.enum'

jest.mock(
  '../../i18n/failure.messages.json',
  () => ({
    TEST_ERROR: {
      title: {
        pt: 'titulo em português',
        en: 'English title',
      },
      template: {
        pt: 'Erro de teste',
        en: 'Test error',
      },
      statusCode: 400,
    },
    NOT_FOUND: {
      title: {
        pt: 'recurso não encontrado',
        en: 'resource not founded',
      },
      template: {
        pt: 'O recurso solicitado não foi encontrado',
        en: 'The expected resource is not found',
      },
      statusCode: 404,
    },
    UNCATALOGUED_ERROR: {
      title: {
        pt: 'erro desconhecido',
        en: 'unknown error',
      },
      template: {
        pt: 'Um erro desconhecido ocorreu',
        en: 'A unknown error',
      },
      statusCode: 500,
    },
  }),
  { virtual: true }
)

describe('FailureMessageProvider', () => {
  let provider: FailureMessageProvider

  beforeEach(async () => {
    ;(FailureMessageProvider as any).instance = null
    provider = FailureMessageProvider.getInstance()
  })

  it('deve retornar a mesma instância quando getInstance é chamado múltiplas vezes', () => {
    // Arrange
    const instance1 = FailureMessageProvider.getInstance()
    const instance2 = FailureMessageProvider.getInstance()

    // Assert
    expect(instance1).toBe(instance2)
  })

  it('deve carregar mensagens do arquivo JSON', () => {
    // Act
    const testErrorConfig = provider.getMessageConfig('TEST_ERROR' as FailureCode)

    // Assert
    expect(testErrorConfig).toBeDefined()
    expect(testErrorConfig?.template!.pt).toBe('Erro de teste')
    expect(testErrorConfig?.template!.en).toBe('Test error')
    expect(testErrorConfig?.statusCode).toBe(400)
  })

  it('deve retornar a configuração de mensagem correta para código de erro existente', () => {
    // Act
    const notFoundConfig = provider.getMessageConfig('NOT_FOUND' as FailureCode)

    // Assert
    expect(notFoundConfig).toBeDefined()
    expect(notFoundConfig?.title.pt).toBe('recurso não encontrado')
    expect(notFoundConfig?.title.en).toBe('resource not founded')
    expect(notFoundConfig?.template!.pt).toBe('O recurso solicitado não foi encontrado')
    expect(notFoundConfig?.template!.en).toBe('The expected resource is not found')
    expect(notFoundConfig?.statusCode).toBe(404)
  })

  it('deve retornar um erro genérico caos o erro não seja identificado', () => {
    // Act
    const genericError = provider.getMessageConfig('UNKNOWN_ERROR_CODE' as FailureCode)

    // Assert
    expect(genericError).toBeDefined()
    expect(genericError.title.pt).toBe('erro desconhecido')
    expect(genericError.title.en).toBe('unknown error')
    expect(genericError.template!.pt).toBe('Um erro desconhecido ocorreu')
    expect(genericError.template!.en).toBe('A unknown error')
    expect(genericError.statusCode).toBe(500)
  })
})
