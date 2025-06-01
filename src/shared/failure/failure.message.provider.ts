import { IFailureMessageProvider } from './failure.message.provider.interface'
import { FailureCode } from './failure.codes.enum'
import { SupportedLanguage } from '@shared/value-object/multilingual-content'
import { RichFailure } from '@shared/failure/rich.failure.type'
import { FailureTemplate } from '@shared/failure/failure.template.type'

const fails = require('../../i18n/failure.messages.json')

/**
 * Provedor de mensagens de erro que carrega e armazena as configurações de mensagens
 * em um singleton para evitar múltiplas leituras do arquivo JSON.
 */
export class FailureMessageProvider implements IFailureMessageProvider {
  private static instance: FailureMessageProvider

  private messagesMap: Map<string, FailureTemplate>

  private constructor() {
    this.messagesMap = new Map()
    this.loadMessages()
  }

  /**
   * Obtém a instância única do provedor de mensagens
   */
  public static getInstance(): FailureMessageProvider {
    if (!FailureMessageProvider.instance) FailureMessageProvider.instance = new FailureMessageProvider()
    return FailureMessageProvider.instance
  }

  /**
   * Obtém a configuração de mensagem para um código de erro específico
   * @param code Código do erro
   * @param language Idioma desejado para as mensagens (padrão: 'pt')
   * @returns Configuração da mensagem ou uma mensagem de erro genérica caso o código não seja categoriazado no arquivo json correspondente
   */
  public getMessageConfig(code: FailureCode, language: SupportedLanguage = SupportedLanguage.PT): RichFailure {
    const failure = this.messagesMap.get(code) || this.messagesMap.get(FailureCode.UNCATALOGUED_ERROR)!

    const lang = language === SupportedLanguage.PT ? 'pt' : 'en'

    return {
      code: code,
      status: failure.status,
      title: failure.title[lang],
      message: failure.template[lang] || failure.template?.en,
    }
  }

  /**
   * Carrega as mensagens do arquivo JSON para o Map
   */
  private loadMessages(): void {
    for (const [code, config] of Object.entries(fails)) {
      this.messagesMap.set(code, config as FailureTemplate)
    }
  }
}
