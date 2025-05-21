import { HttpStatus } from "@nestjs/common";
import { SimpleFailure } from "./simple.failure.type";
import { RichFailure } from "./rich.failure.type";
import { IFailureMessageProvider } from "./failure.message.provider.interface";
import { IFailureMapper } from "./failure.mapper.interface";
import { FailureMessageProvider } from "./failure.message.provider";

/**
 * Classe responsável por mapear SimpleFailure para RichFailureType,
 * utilizando as configurações definidas no arquivo failure.messages.json
 */
export class FailureMapper implements IFailureMapper {
  private static instance: FailureMapper | null = null;

  private constructor(
    private readonly messageProvider: IFailureMessageProvider = FailureMessageProvider.getInstance(),
  ) {}

  public static getInstance(): FailureMapper {
    if (FailureMapper.instance === null)
      FailureMapper.instance = new FailureMapper();
    return FailureMapper.instance;
  }

  /**
   * Reseta a instância do singleton (útil para testes)
   */
  public static reset(): void {
    FailureMapper.instance = null;
  }

  /**
   * Define um provedor de mensagens personalizado (útil para testes)
   */
  public static setMessageProvider(provider: IFailureMessageProvider): void {
    FailureMapper.reset();
    FailureMapper.instance = new FailureMapper(provider);
  }

  /**
   * Converte um objeto SimpleFailure em um objeto RichFailureType
   *
   * @param failure O objeto SimpleFailure a ser convertido
   * @param language Idioma desejado para as mensagens (padrão: 'pt')
   * @returns Um objeto RichFailureType com informações completas sobre o erro
   */
  public toRichFailure(
    failure: SimpleFailure,
    language: "pt" | "en" = "pt",
  ): RichFailure {
    const messageConfig = this.messageProvider.getMessageConfig(failure.code);

    const messageTemplate =
      messageConfig.template?.[language] || messageConfig.template?.en;
    const title = messageConfig.template[language] || messageConfig.template.en;

    const status = messageConfig.statusCode as HttpStatus;

    let formattedMessage = title;
    if (messageTemplate) {
      formattedMessage = this.formatMessageWithTemplate(
        messageTemplate,
        failure.details || {},
      );
    }

    return {
      code: failure.code,
      status,
      title,
      message: formattedMessage,
    };
  }

  /**
   * Formata uma mensagem substituindo os placeholders pelos valores dos detalhes
   *
   * @param template Template da mensagem com placeholders no formato {placeholder}
   * @param details Objeto com os valores para substituir os placeholders
   * @returns Mensagem formatada com os valores substituídos
   */
  private formatMessageWithTemplate(
    template: string,
    details: Record<string, any>,
  ): string {
    return template.replace(/{(\w+)}/g, (match, placeholder) => {
      if (details && details[placeholder] !== undefined) {
        return String(details[placeholder]);
      }
      return match; // Mantém o placeholder se não houver valor correspondente
    });
  }

  /**
   * Converte múltiplos objetos SimpleFailure em objetos RichFailureType
   *
   * @param failures Array de objetos SimpleFailure a serem convertidos
   * @param language Idioma desejado para as mensagens (padrão: 'pt')
   * @returns Array de objetos RichFailureType
   */
  public toRichFailures(
    failures: SimpleFailure[],
    language: "pt" | "en" = "pt",
  ): RichFailure[] {
    return failures.map((failure) => this.toRichFailure(failure, language));
  }
}
