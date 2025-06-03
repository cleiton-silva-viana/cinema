import { Result } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { TechnicalError } from '@/shared/error/technical.error'

/**
 * Matchers customizados para Jest específicos do domínio do cinema
 */
export {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeValidResult(): R
      toBeInvalidResult(): R
      toHaveFailureCode(expectedCode: FailureCode): R
      toHaveFailureCodes(expectedCodes: FailureCode[]): R
      toThrowTechnicalError(): R
      toHaveTechnicalErrorCode(expectedCode: FailureCode): R
    }
  }
}

/**
 * Matcher para verificar se um Result é válido (success)
 */
function toBeValidResult(received: Result<any>) {
  const pass = received.isValid()

  if (pass) {
    return {
      message: () => `Expected Result to be invalid, but it was valid`,
      pass: true,
    }
  } else {
    return {
      message: () => {
        const failures = received.failures.map((f) => `${f.code}`).join(', ')
        return `Expected Result to be valid, but it was invalid with failures: ${failures}`
      },
      pass: false,
    }
  }
}

/**
 * Matcher para verificar se um Result é inválido (failure)
 */
function toBeInvalidResult(received: Result<any>) {
  const pass = received.isInvalid()

  if (pass) {
    return {
      message: () => `Expected Result to be valid, but it was invalid`,
      pass: true,
    }
  } else {
    return {
      message: () => `Expected Result to be invalid, but it was valid with value: ${JSON.stringify(received.value)}`,
      pass: false,
    }
  }
}

/**
 * Matcher para verificar se um Result contém um código de falha específico
 */
function toHaveFailureCode(received: Result<any>, expectedCode: FailureCode) {
  if (received.isValid()) {
    return {
      message: () => `Expected Result to have failure code '${expectedCode}', but Result was valid`,
      pass: false,
    }
  }

  const hasCode = received.failures.some((failure: SimpleFailure) => failure.code === expectedCode)

  if (hasCode) {
    return {
      message: () => `Expected Result not to have failure code '${expectedCode}', but it did`,
      pass: true,
    }
  } else {
    const actualCodes = received.failures.map((f: SimpleFailure) => f.code).join(', ')
    return {
      message: () => `Expected Result to have failure code '${expectedCode}', but got: ${actualCodes}`,
      pass: false,
    }
  }
}

/**
 * Matcher para verificar se um Result contém múltiplos códigos de falha
 */
function toHaveFailureCodes(received: Result<any>, expectedCodes: FailureCode[]) {
  if (received.isValid()) {
    return {
      message: () => `Expected Result to have failure codes [${expectedCodes.join(', ')}], but Result was valid`,
      pass: false,
    }
  }

  const actualCodes = received.failures.map((f: SimpleFailure) => f.code)
  const hasAllCodes = expectedCodes.every((code) => actualCodes.includes(code))

  if (hasAllCodes) {
    return {
      message: () => `Expected Result not to have all failure codes [${expectedCodes.join(', ')}], but it did`,
      pass: true,
    }
  } else {
    const missingCodes = expectedCodes.filter((code) => !actualCodes.includes(code))
    return {
      message: () =>
        `Expected Result to have failure codes [${expectedCodes.join(', ')}], but missing: [${missingCodes.join(', ')}]. Actual codes: [${actualCodes.join(', ')}]`,
      pass: false,
    }
  }
}

/**
 * Matcher para verificar se um valor é uma instância de TechnicalError.
 * Útil para testar se uma função lança um TechnicalError.
 */
function toThrowTechnicalError(received: any) {
  const pass = received instanceof TechnicalError
  return {
    message: () =>
      pass
        ? `Expected value not to be instance of TechnicalError, but it was.`
        : `Expected value to be instance of TechnicalError, but got: ${received?.constructor?.name}`,
    pass,
  }
}

/**
 * Matcher para verificar se um TechnicalError tem um código de falha específico.
 * @param received A instância de TechnicalError recebida.
 * @param expectedCode O código de falha esperado.
 */
function toHaveTechnicalErrorCode(received: TechnicalError, expectedCode: FailureCode) {
  const pass = received instanceof TechnicalError && received.message.includes(expectedCode) 
  return {
    message: () =>
      pass
        ? `Expected TechnicalError not to have code '${expectedCode}', but it did.`
        : `Expected TechnicalError to have code '${expectedCode}', but got: '${received.message}'`,
    pass,
  }
}

export function setupCustomMatchers() {
  expect.extend({
    toBeValidResult,
    toBeInvalidResult,
    toHaveFailureCode,
    toHaveFailureCodes,
    toThrowTechnicalError,
    toHaveTechnicalErrorCode,
  })
}
