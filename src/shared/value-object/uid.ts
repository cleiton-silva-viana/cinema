import { v7 } from "uuid";
import { failure, Result, success } from "../result/result";
import { SimpleFailure } from "../failure/simple.failure.type";
import { Assert, Flow } from "../assert/assert";
import { not } from "../assert/not";
import { is } from "../assert/is";
import {isBlank, isNull, isUIDv7} from "../validator/validator";
import {TechnicalError} from "../error/technical.error";

/**
 * Classe base abstrata para valores de identificação únicos (UIDs)
 * Fornece métodos padrão para validação, criação e comparação de UIDs
 */
export abstract class UID {
    /**
     * Prefixo esperado para esta classe UID (deve ser definido na classe derivada)
     */
    protected static readonly PREFIX: string = ''

    /**
     * Separador entre prefixo e o valor UUID
     */
    protected static readonly SEPARATOR: string = '.'

    /**
     * Comprimento padrão para UUIDs
     */
    private static readonly UUID_LENGTH: number = 36

    /**
     * Parte contendo a string em formato uuid v7
     */
    private readonly UUID: string

    /**
     * Construtor protegido para inicialização da classe base
     * @param uuid Parte do UUID (sem o prefixo)
     */
    protected constructor(uuid: string) {
        this.UUID = uuid;
    }

    /**
     * Retorna o valor completo do UID (prefixo + UUID)
     */
    public get value(): string {
        const concreteClass = this.constructor as typeof UID;
        return concreteClass.PREFIX + concreteClass.SEPARATOR + this.UUID;
    }

    /**
     * Cria uma nova instância de UID com um UUID v7 gerado
     * @returns Result contendo a nova instância ou falha
     */
    public static create(): UID {
        const uuid = v7();
        return new (this as any)(uuid);
    }

    public static hydrate(value: string): UID {
        TechnicalError.if(isBlank(value), 'NULL_ARGUMENT')
        const uid = UID.extractUuidPart(value, this);
        return new (this as any)(uid);
    }

    /**
     * Tenta criar uma instância de UID a partir de uma string
     * @param value String contendo o UID completo
     * @returns Result contendo a instância ou falha
     */
    public static parse(value: string): Result<UID> {
        const failures: SimpleFailure[] = [];

        Assert.all(
          failures,
          { field: 'uid' },
          not.null(value, 'NULL_ARGUMENT', {}, Flow.stop),
          not.empty(value, 'EMPTY_FIELD', {}, Flow.stop),
          is.true(value?.startsWith(this.PREFIX), 'INVALID_UUID', {}, Flow.stop),
          is.equal(value?.length, UID.UUID_LENGTH + this.PREFIX.length + this.SEPARATOR.length, 'INVALID_UUID', {}, Flow.stop),
          is.true(UID.validateUuidPart(value, this), 'INVALID_UUID')
        )

        if (failures.length > 0) return failure(failures);
        
        const uuidPart = UID.extractUuidPart(value, this);
        return success(new (this as any)(uuidPart));
    }

    /**
     * Compara este UID com outro UID
     * @param other Outro UID para comparação
     * @returns true se os UIDs são iguais, false caso contrário
     */
    public equal(other: UID): boolean {
        if (isNull(other)) return false;
        return (other instanceof UID && other.value === this.value);
    }

    /**
     * Extrai a parte UUID de um valor completo de UID
     * @param value String contendo o UID completo
     * @returns A parte UUID do valor
     */
    private static extractUuidPart(value: string, concreteClass: typeof UID): string {
        const prefixWithSeparator = concreteClass.PREFIX + concreteClass.SEPARATOR;
        if (value && value.startsWith(prefixWithSeparator)) {
           return value.substring(prefixWithSeparator.length);
        }
        return '';
    }

    /**
     * Método de validação da parte UUID. A implementação padrão valida UUID v7.
     * As classes derivadas PODEM sobrescrever este método estático se necessitarem de validação diferente.
     * @param uid Parte do UUID a ser validada
     * @returns true se a validação for bem-sucedida, false caso contrário
     */
    protected static validateUuidPart(uid: string, concreteClass: typeof UID): boolean {
        const uidPart = this.extractUuidPart(uid, concreteClass);
        return isUIDv7(uidPart);
    }
}
