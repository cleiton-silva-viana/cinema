import { IFailureMessageProvider } from "./failure.message.provider.interface";

const fails = require('./failure.messages.json');

/**
 * Interface que representa a estrutura de uma mensagem de erro no arquivo failure.messages.json
 */
export interface FailureMessageConfig {
  message: {
    pt: string;
    en: string;
  };
  statusCode: number;
}

/**
 * Provedor de mensagens de erro que carrega e armazena as configurações de mensagens
 * em um singleton para evitar múltiplas leituras do arquivo JSON.
 */
export class FailureMessageProvider implements IFailureMessageProvider {
  private static instance: FailureMessageProvider;
  private messagesMap: Map<string, FailureMessageConfig>;

  private constructor() {
    this.messagesMap = new Map();
    this.loadMessages();
  }

  /**
   * Obtém a instância única do provedor de mensagens
   */
  public static getInstance(): FailureMessageProvider {
    if (!FailureMessageProvider.instance) {
      FailureMessageProvider.instance = new FailureMessageProvider();
    }
    return FailureMessageProvider.instance;
  }

  /**
   * Carrega as mensagens do arquivo JSON para o Map
   */
  private loadMessages(): void {
    for (const [code, config] of Object.entries(fails)) {
      this.messagesMap.set(code, config as FailureMessageConfig);
    }
  }

  /**
   * Obtém a configuração de mensagem para um código de erro específico
   * @param code Código do erro
   * @returns Configuração da mensagem ou undefined se não encontrada
   */
  public getMessageConfig(code: string): FailureMessageConfig | undefined {
    return this.messagesMap.get(code);
  }
}
