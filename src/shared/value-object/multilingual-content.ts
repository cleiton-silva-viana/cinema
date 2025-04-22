import { SimpleFailure } from "../failure/simple.failure.type";
import { failure, Result, success } from "../result/result";
import { Assert, Flow } from "../assert/assert";
import { is } from "../assert/is";
import { not } from "../assert/not";
import { TechnicalError } from "../error/technical.error";

export const codes = {
  contentNullOrEmpty: 'CONTENT_NULL_OR_EMPTY',
  contentInvalidLanguage: 'CONTENT_INVALID_LANGUAGE',
  contentInvalidType: 'CONTENT_INVALID_TYPE',
  contentDuplicateLanguage: "CONTENT_DUPLICATE_LANGUAGE",
  contentMissingRequiredLanguage: "CONTENT_MISSING_REQUIRED_LANGUAGE"
}


/**
 * Idiomas suportados pela aplicação
 */
export enum SupportedLanguage {
  PT = "pt",
  EN = "en",
}

/**
 * Interface para entrada de conteúdo multilíngue
 */
export interface MultilingualInput {
  text: string;
  language: string;
}


/**
 * Interface que define a estrutura de um conteúdo em um idioma específico
 */
export interface LanguageContent {
  language: SupportedLanguage;
  text: string;
}

/**
 * Classe base abstrata para conteúdo multi-idioma
 */
export abstract class MultilingualContent<T extends MultilingualContent<T>> {

  /**
   * Construtor protegido para garantir imutabilidade
   * @param contents Map com os conteúdos em diferentes idiomas
   */
  protected constructor(
    protected readonly contents: Map<SupportedLanguage, string>
  ) {}

  /**
   * Método abstrato para validações específicas da subclasse.
   * Este método é chamado *depois* das validações gerais e da criação da instância no método `create`.
   * @param contents O array original de conteúdos passado para `create`. // TODO: (Design) Por que passar `contents` aqui? A instância já tem `this._contents`. Seria mais simples/limpo validar com base no estado interno? Assinatura sugerida: `protected abstract validate(errors: SimpleFailure[]): void;` e a implementação usaria `this._contents`.
   * @param errors Array para adicionar falhas específicas da subclasse.
   */
  protected abstract validate(
    contents: LanguageContent[],
    errors: SimpleFailure[],
  ): void;

  /**
  * Obtém o conteúdo em um idioma específico
  */
  public content(language: SupportedLanguage): string | undefined {
    return this.contents.get(language);
  }

  /**
   * Verifica se possui conteúdo em um idioma específico
   */
  public hasLanguage(language: SupportedLanguage): boolean {
    return this.contents.has(language);
  }

  /**
   * Obtém todos os idiomas disponíveis
   */
  public languages(): SupportedLanguage[] {
    return Array.from(this.contents.keys());
  }


  /**
   * Cria uma nova instância de conteúdo multi-idioma
   * @param contents Array de conteúdos em diferentes idiomas
   * @returns Result contendo a instância ou falha
   */
  public static create<T extends MultilingualContent<T>>(contents: MultilingualInput[]): Result<T> {
    const failures: SimpleFailure[] = [];

    this.validateContentArray(contents, failures);
    if (failures.length > 0) return failure(failures)

    const contentsParsed: LanguageContent[] = []
    contents.forEach((content) => {
      contentsParsed.push(this.toLanguageContent(content, failures))
    })
    if (failures.length > 0) return failure(failures);

    MultilingualContent.validateContents(contentsParsed, failures);
    if (failures.length > 0) return failure(failures);

    MultilingualContent.validateRequiredLanguages(contentsParsed, failures);
    if (failures.length > 0) return failure(failures);

    const contentsMap = new Map<SupportedLanguage, string>();
    contentsParsed.forEach(content => {
      contentsMap.set(content.language, content.text);
    });

    const instance = new (this as any)(contentsMap)
    instance.validate(contents, failures);

    return (failures.length > 0)
      ? failure(failures)
      : success(instance);
  }

  /**
   * Cria uma nova instância de conteúdo um único idioma a partir de um idioma e um valor
   * @param lang Idioma do conteúdo
   * @param value Valor do conteúdo
   * @returns Instância de conteúdo multi-idioma
   */
  public static hydrate<T extends MultilingualContent<T>>(
    lang: SupportedLanguage,
    value: string,
  ): T {
    TechnicalError.if(!lang || !value?.trim(), "NULL_ARGUMENT");

    const contentMap = new Map<SupportedLanguage, string>();
    contentMap.set(lang, value);

    return new (this as any)(contentMap);
  }

  /**
   * Valida os inputs básicos do conteúdo
   * @param contents Array de conteúdos a ser validado
   * @param failures Array para armazenar os erros encontrados
   */
  private static validateContentArray(
    contents: any,
    failures: SimpleFailure[],
  ): void {
    Assert.all(
      failures,
      { field: "contents" },

      not.null(contents, codes.contentNullOrEmpty, {}, Flow.stop),
      is.array(
        contents,
        codes.contentInvalidType,
        {},
        Flow.stop,
      ),
      not.empty(contents, codes.contentNullOrEmpty),
    );
  }

  /**
   * Valida um conteúdo individual
   * @param content Conteúdo a ser validado
   * @param failures Array para armazenar os erros encontrados
   * @return true se não houve erros, false se foi identificado algum tipo de erro
   */
  private static validateContent(
    content: LanguageContent,
    failures: SimpleFailure[],
  ): boolean {
    const flag = failures.length;

    Assert.all(
      failures,
      { field: "language" },
      not.null(content, codes.contentNullOrEmpty, {}, Flow.stop),
      not.null(content.language, codes.contentNullOrEmpty, {}, Flow.stop),
      is.string(content.language, codes.contentInvalidType, {}, Flow.stop),
      is.contains(
        Object.values(SupportedLanguage),
        content.language.toLowerCase(),
        codes.contentInvalidLanguage,
      ),
    );

    return failures.length === flag; // Retorna true se não houve erros
  }

  /**
   * Valida todos os conteúdos no array e verifica duplicatas de idioma.
   * @param contents Array de conteúdos a ser validado
   * @param failures Array para armazenar os erros encontrados
   */
  private static validateContents(
    contents: LanguageContent[],
    failures: SimpleFailure[],
  ): void {
    const seenLanguages = new Set<SupportedLanguage>();

    for (const content of contents) {
      const isValid = this.validateContent(content, failures);
      if (!isValid) continue; // Se não é válido, pula para o próximo

      // Verifica duplicidade de idioma
      if (seenLanguages.has(content.language)) {
        failures.push({
          code: codes.contentDuplicateLanguage, // Corrigido o código de erro
          details: { language: content.language },
        });
        continue;
      }

      seenLanguages.add(content.language);
    }
  }

  // Refatorar
  /**
   * Converte uma string ou SupportedLanguage para o enum correspondente
   * @param language Idioma a ser convertido
   * @returns O enum correspondente ou undefined se inválido
   */
  private static toSupportedLanguage(language: string): SupportedLanguage {
    if (typeof language === 'string') {
      return Object.values(SupportedLanguage).find(
        (lang) => lang === language.toLowerCase()
      );
    }
  }

  private static toLanguageContent(content: MultilingualInput, failures: SimpleFailure[]): LanguageContent | undefined {
    const languageEnum = MultilingualContent.toSupportedLanguage(content.language);
    if (!languageEnum) {
      failures.push({
        code: codes.contentInvalidLanguage,
        details: {
          providedLanguage: content.language,
          supportedLanguages: Object.values(SupportedLanguage)
        }
      });
      return
    }
    return {
      language: languageEnum,
      text: content.text,
    }
  }

  /**
   * Valida se os idiomas obrigatórios (PT e EN) estão presentes.
   * @param contents Array de conteúdos em diferentes idiomas
   * @param failures Array para armazenar os erros encontrados
   */
  private static validateRequiredLanguages(
    contents: LanguageContent[],
    failures: SimpleFailure[],
  ): void {
    const languages = new Set(
      contents.map(content => content.language)
    );

    const requiredLanguages = [
      { lang: SupportedLanguage.PT, message: "Portuguese (pt) content is required." },
      { lang: SupportedLanguage.EN, message: "English (en) content is required." }
    ];

    for (const { lang, message } of requiredLanguages) {
      if (!languages.has(lang)) {
        failures.push({
          code: codes.contentMissingRequiredLanguage,
          details: {
            requiredLanguage: lang,
            message
          }
        });
      }
    }
  }
}
