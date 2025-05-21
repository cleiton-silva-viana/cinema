import { IFailureMessageProvider } from "./failure.message.provider.interface";
import { FailureCode } from "./failure.codes.enum";

const fails = require("./failure.messages.json");

/**
 * Interface que representa a estrutura de uma mensagem de erro no arquivo failure.messages.json
 */
export interface FailureMessageConfig {
  title: {
    pt: string;
    en: string;
  };
  statusCode: number;
  /**
   * Template opcional para formatação de mensagens de erro.
   * Contém placeholders no formato {placeholder} que serão substituídos
   * pelos valores correspondentes nos detalhes do erro.
   * Exemplo: "O campo {field} não está definido"
   */
  template?: {
    pt?: string;
    en?: string;
  };
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
    if (!FailureMessageProvider.instance)
      FailureMessageProvider.instance = new FailureMessageProvider();
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
   * @returns Configuração da mensagem ou uma mensagem de erro genérica caso o código não seja categoriazado no arquivo json correspondente
   */
  public getMessageConfig(code: FailureCode): FailureMessageConfig {
    const failure = this.messagesMap.get(code);
    return failure === undefined
      ? this.messagesMap.get(FailureCode.UNCATALOGUED_ERROR)
      : failure;
  }
}
