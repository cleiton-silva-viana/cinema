import { FailureMessageProvider } from './failure.message.provider'
import { FailureCode } from './failure.codes.enum'
import { SupportedLanguage } from '@shared/value-object/multilingual-content'

jest.mock(
  '../../i18n/failure.messages.json',
  () => ({
    TEST_ERROR: {
      title: {
        pt: 'titulo em português',
        en: 'English title',
      },
      template: {
        pt: 'Mensagem do erro em português',
        en: 'Test error',
      },
      status: 400,
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
      status: 404,
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
      status: 500,
    },
    ERROR_WITHOUT_PT_TEMPLATE: {
      title: {
        pt: 'Erro sem template PT',
        en: 'Error without PT template',
      },
      template: {
        en: 'This error only has an English template',
      },
      status: 400,
    },
  }),
  { virtual: true }
)

describe('FailureMessageProvider', () => {
  let provider: FailureMessageProvider

  beforeEach(() => {
    ;(FailureMessageProvider as any).instance = null
    provider = FailureMessageProvider.getInstance()
  })

  it('deve retornar a mesma instância quando getInstance é chamado múltiplas vezes', () => {
    // Act
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
    expect(testErrorConfig.message).toBeDefined()
    expect(testErrorConfig.title).toBe('titulo em português')
    expect(testErrorConfig.message).toBe('Mensagem do erro em português')
    expect(testErrorConfig.status).toBe(400)
  })

  it('deve retornar a configuração de mensagem correta para código de erro existente em português', () => {
    // Act
    const notFoundConfig = provider.getMessageConfig('NOT_FOUND' as FailureCode, SupportedLanguage.PT)

    // Assert
    expect(notFoundConfig).toBeDefined()
    expect(notFoundConfig.title).toBe('recurso não encontrado')
    expect(notFoundConfig.message).toBe('O recurso solicitado não foi encontrado')
    expect(notFoundConfig.status).toBe(404)
  })

  it('deve retornar a configuração de mensagem correta para código de erro existente em inglês', () => {
    // Act
    const notFoundConfig = provider.getMessageConfig('NOT_FOUND' as FailureCode, SupportedLanguage.EN)

    // Assert
    expect(notFoundConfig).toBeDefined()
    expect(notFoundConfig.title).toBe('resource not founded')
    expect(notFoundConfig.message).toBe('The expected resource is not found')
    expect(notFoundConfig.status).toBe(404)
  })

  it('deve retornar um erro genérico caso o erro não seja identificado em português', () => {
    // Act
    const genericError = provider.getMessageConfig('UNKNOWN_ERROR_CODE' as FailureCode, SupportedLanguage.PT)

    // Assert
    expect(genericError).toBeDefined()
    expect(genericError.title).toBe('erro desconhecido')
    expect(genericError.message).toBe('Um erro desconhecido ocorreu')
    expect(genericError.status).toBe(500)
  })

  it('deve retornar um erro genérico caso o erro não seja identificado em inglês', () => {
    // Act
    const genericError = provider.getMessageConfig('UNKNOWN_ERROR_CODE' as FailureCode, SupportedLanguage.EN)

    // Assert
    expect(genericError).toBeDefined()
    expect(genericError.title).toBe('unknown error')
    expect(genericError.message).toBe('A unknown error')
    expect(genericError.status).toBe(500)
  })

  it('deve fazer fallback para o template em inglês se o template do idioma solicitado não existir', () => {
    // Act
    const errorConfig = provider.getMessageConfig('ERROR_WITHOUT_PT_TEMPLATE' as FailureCode, SupportedLanguage.PT)

    // Assert
    expect(errorConfig).toBeDefined()
    expect(errorConfig.title).toBe('Erro sem template PT')
    expect(errorConfig.message).toBe('This error only has an English template')
    expect(errorConfig.status).toBe(400)
  })

  it('deve usar o idioma padrão (português) se nenhum idioma for especificado', () => {
    // Act
    const testErrorConfig = provider.getMessageConfig('TEST_ERROR' as FailureCode)

    // Assert
    expect(testErrorConfig).toBeDefined()
    expect(testErrorConfig.title).toBe('titulo em português')
    expect(testErrorConfig.message).toBe('Mensagem do erro em português')
    expect(testErrorConfig.status).toBe(400)
  })
})
