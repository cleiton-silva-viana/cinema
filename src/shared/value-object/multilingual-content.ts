import { SimpleFailure } from "../failure/simple.failure.type";
import { failure, Result, success } from "../result/result";
import { Assert, Flow } from "../assert/assert";
import { is } from "../assert/is";
import { not } from "../assert/not";
import { TechnicalError } from "../error/technical.error";

export const codes = {
  contentNullOrEmpty: "CONTENT_NULL_OR_EMPTY",
  contentInvalidLanguage: "CONTENT_INVALID_LANGUAGE",
  contentInvalidType: "CONTENT_INVALID_TYPE",
  contentDuplicateLanguage: "CONTENT_DUPLICATE_LANGUAGE",
  contentMissingRequiredLanguage: "CONTENT_MISSING_REQUIRED_LANGUAGE",
  contentLengthOutOfRange: "CONTENT_LENGTH_OUT_OF_RANGE",
  contentInvalidFormat: 'CONTENT_INVALID_FORMAT'
};

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
  text: string;
  language: SupportedLanguage;
}

/**
 * Classe base abstrata para conteúdo multi-idioma
 */
export abstract class MultilingualContent {
  /**
   * Configurações de validação que podem ser sobrescritas pelas classes derivadas
   */
  protected static readonly MIN_LENGTH: number = 1;
  protected static readonly MAX_LENGTH: number = 500;
  protected static readonly REQUIRED_LANGUAGES: SupportedLanguage[] = [
    SupportedLanguage.PT,
    SupportedLanguage.EN,
  ];

  /**
   * Expressão regular para validar o formato do texto
   * Por padrão, não permite múltiplos espaços consecutivos
   */
  protected static readonly FORMAT_REGEX: RegExp = /^[A-Za-zÀ-ÖØ-öø-ÿ\d\s\-._]+$/;

  /**
   * Construtor protegido para garantir imutabilidade
   * @param contents Map com os conteúdos em diferentes idiomas
   */
  protected constructor(
    protected readonly contents: Map<SupportedLanguage, string>,
  ) {}

  /**
   * Cria uma nova instância de conteúdo multi-idioma
   * @param contents Array de conteúdos em diferentes idiomas
   * @returns Result contendo a instância ou falha
   */
  public static create<T extends MultilingualContent>(
    contents: MultilingualInput[],
  ): Result<T> {
    const failures: SimpleFailure[] = [];

    MultilingualContent.validateContentArray(contents, failures);
    if (failures.length > 0) return failure(failures);

    const contentsParsed: LanguageContent[] = [];
    contents.forEach((content) => {
      contentsParsed.push(this.toLanguageContent(content, failures));
    });

    this.validateContents(contentsParsed, failures);
    if (failures.length > 0) return failure(failures);

    this.validateRequiredLanguages(contentsParsed, failures);
    if (failures.length > 0) return failure(failures);

    const contentsMap = new Map<SupportedLanguage, string>();
    contentsParsed.forEach((content) => {
      contentsMap.set(content.language, content.text);
    });

    return success(new (this as any)(contentsMap));
  }

  /**
   * Cria uma nova instância de conteúdo um único idioma a partir de um idioma e um valor
   * @param lang Idioma do conteúdo
   * @param value Valor do conteúdo
   * @returns Instância de conteúdo multi-idioma
   */
  public static hydrate<T extends MultilingualContent>(
    lang: string,
    value: string,
  ): T {
    TechnicalError.if(!lang?.trim() || !value?.trim(), "NULL_ARGUMENT");

    const langEnum = this.toSupportedLanguage(lang);
    TechnicalError.if(!langEnum, "INVALID_ARGUMENT");

    const contentMap = new Map<SupportedLanguage, string>();
    contentMap.set(langEnum, value);

    return new (this as any)(contentMap);
  }

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
   * Converte uma string ou SupportedLanguage para o enum correspondente
   * @param language Idioma a ser convertido
   * @returns O enum correspondente ou undefined se inválido
   */
  private static toSupportedLanguage(language: string): SupportedLanguage {
    if (typeof language === "string") {
      return Object.values(SupportedLanguage).find(
        (lang) => lang === language.toLowerCase(),
      );
    }
  }

  /**
   * Converte um MultilingualInput para LanguageContent
   * @param content Conteúdo a ser convertido
   * @param failures Array para armazenar os erros encontrados
   * @returns LanguageContent ou undefined se inválido
   */
  private static toLanguageContent(
    content: MultilingualInput,
    failures: SimpleFailure[],
  ): LanguageContent | undefined {
    const languageEnum = MultilingualContent.toSupportedLanguage(
      content.language,
    );
    if (!languageEnum) {
      failures.push({
        code: codes.contentInvalidLanguage,
        details: {
          providedLanguage: content.language,
          supportedLanguages: Object.values(SupportedLanguage),
        },
      });
      return;
    }
    return {
      language: languageEnum,
      text: content.text,
    };
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
      is.array(contents, codes.contentInvalidType, {}, Flow.stop),
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
      is.string(content.text, codes.contentInvalidType, {}, Flow.stop),
      is.contains(
        Object.values(SupportedLanguage),
        content.language.toLowerCase(),
        codes.contentInvalidLanguage,
        {},
        Flow.stop,
      ),
      is.between(
        content.text,
        this.MIN_LENGTH,
        this.MAX_LENGTH,
        codes.contentLengthOutOfRange,
        { actual: content.text.length },
        Flow.stop,
      ),
      is.match(
        content.text,
        this.FORMAT_REGEX,
        codes.contentInvalidFormat,
        {
          language: content.language,
          value: content.text,
        },
        Flow.stop,
      ),
    );

    return failures.length === flag;
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
      const isInvalid = !this.validateContent(content, failures);
      if (isInvalid) continue;

      if (seenLanguages.has(content.language)) {
        failures.push({
          code: codes.contentDuplicateLanguage,
          details: { language: content.language },
        });
        continue;
      }

      seenLanguages.add(content.language);
    }
  }

  /**
   * Valida se os idiomas obrigatórios estão presentes.
   * @param contents Array de conteúdos em diferentes idiomas
   * @param failures Array para armazenar os erros encontrados
   */
  private static validateRequiredLanguages(
    contents: LanguageContent[],
    failures: SimpleFailure[],
  ): void {
    const languages = new Set(contents.map((content) => content.language));

    for (const requiredLang of this.REQUIRED_LANGUAGES) {
      Assert.all(
        failures,
        {},
        is.true(
          languages.has(requiredLang),
          codes.contentMissingRequiredLanguage,
          { requiredLanguage: requiredLang },
        ),
      );
    }
  }
}
