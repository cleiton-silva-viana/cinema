import { Result } from '@shared/result/result'
import { SimpleFailure } from '@shared/failure/simple.failure.type'
import { FailureCode } from '@shared/failure/failure.codes.enum'
import { TechnicalError } from '@/shared/error/technical.error'
import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils'

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
      message: () =>
        matcherHint('.not.toBeValidResult', 'received', '') +
        '\n\n' +
        'Expected Result to be invalid, but it was valid\n' +
        'Received: ' +
        printReceived(received),
      pass: true,
    }
  } else {
    const failures = received.failures.map((f) => f.code).join(', ')
    return {
      message: () =>
        matcherHint('.toBeValidResult', 'received', '') +
        '\n\n' +
        'Expected Result to be valid, but it was invalid\n' +
        'Failures: ' +
        printReceived(`[${failures}]`),
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
      message: () =>
        matcherHint('.not.toBeInvalidResult', 'received', '') +
        '\n\n' +
        'Expected Result to be valid, but it was invalid\n' +
        'Received: ' +
        printReceived(received),
      pass: true,
    }
  } else {
    return {
      message: () =>
        matcherHint('.toBeInvalidResult', 'received', '') +
        '\n\n' +
        'Expected Result to be invalid, but it was valid\n' +
        'Received value: ' +
        printReceived(received.value),
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
      message: () =>
        matcherHint('.toHaveFailureCode', 'received', 'expectedCode') +
        '\n\n' +
        'Expected Result to have failure code:\n' +
        '  ' +
        printExpected(expectedCode) +
        '\n' +
        'But Result was valid with value:\n' +
        '  ' +
        printReceived(received.value),
      pass: false,
    }
  }

  const hasCode = received.failures.some((failure: SimpleFailure) => failure.code === expectedCode)
  const actualCodes = received.failures.map((f: SimpleFailure) => f.code)

  if (hasCode) {
    return {
      message: () =>
        matcherHint('.not.toHaveFailureCode', 'received', 'expectedCode') +
        '\n\n' +
        'Expected Result not to have failure code:\n' +
        '  ' +
        printExpected(expectedCode) +
        '\n' +
        'But it was found in failures:\n' +
        '  ' +
        printReceived(actualCodes),
      pass: true,
    }
  } else {
    return {
      message: () =>
        matcherHint('.toHaveFailureCode', 'received', 'expectedCode') +
        '\n\n' +
        'Expected Result to have failure code:\n' +
        '  ' +
        printExpected(expectedCode) +
        '\n' +
        'Received failure codes:\n' +
        '  ' +
        printReceived(actualCodes),
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
      message: () =>
        matcherHint('.toHaveFailureCodes', 'received', 'expectedCodes') +
        '\n\n' +
        'Expected Result to have failure codes:\n' +
        '  ' +
        printExpected(expectedCodes) +
        '\n' +
        'But Result was valid with value:\n' +
        '  ' +
        printReceived(received.value),
      pass: false,
    }
  }

  const actualCodes = received.failures.map((f: SimpleFailure) => f.code)
  const hasAllCodes = expectedCodes.every((code) => actualCodes.includes(code))
  const missingCodes = expectedCodes.filter((code) => !actualCodes.includes(code))

  if (hasAllCodes) {
    return {
      message: () =>
        matcherHint('.not.toHaveFailureCodes', 'received', 'expectedCodes') +
        '\n\n' +
        'Expected Result not to have all failure codes:\n' +
        '  ' +
        printExpected(expectedCodes) +
        '\n' +
        'But all were found in:\n' +
        '  ' +
        printReceived(actualCodes),
      pass: true,
    }
  } else {
    return {
      message: () =>
        matcherHint('.toHaveFailureCodes', 'received', 'expectedCodes') +
        '\n\n' +
        'Expected Result to have failure codes:\n' +
        '  ' +
        printExpected(expectedCodes) +
        '\n' +
        'Missing codes:\n' +
        '  ' +
        printExpected(missingCodes) +
        '\n' +
        'Received failure codes:\n' +
        '  ' +
        printReceived(actualCodes),
      pass: false,
    }
  }
}

/**
 * Matcher para verificar se um valor é uma instância de TechnicalError.
 * Útil para testar se uma função lança um TechnicalError.
 */
function toThrowTechnicalError(received: any) {
  let thrownError: any
  let isFunction = typeof received === 'function'
  if (isFunction) {
    try {
      received()
    } catch (err) {
      thrownError = err
    }
  }
  const valueToCheck = isFunction ? thrownError : received
  const pass = valueToCheck instanceof TechnicalError
  return {
    message: () =>
      pass
        ? `Expected value not to be instance of TechnicalError, but it was.`
        : `Expected value to be instance of TechnicalError, but got: ${valueToCheck?.constructor?.name}`,
    pass,
  }
}

/**
 * Matcher para verificar se um TechnicalError tem um código de falha específico.
 * @param received A instância de TechnicalError recebida.
 * @param expectedCode O código de falha esperado.
 */
function toHaveTechnicalErrorCode(received: any, expectedCode: FailureCode) {
  let throwErr: any
  let isFunction = typeof received === 'function'

  if (isFunction) {
    try {
      received()
    } catch (err) {
      throwErr = err
    }
  }

  const valueToCheck = isFunction ? throwErr : received
  const isInstanceOfTechnicalError = valueToCheck instanceof TechnicalError

  if (!isInstanceOfTechnicalError) {
    return {
      message: () =>
        isInstanceOfTechnicalError
          ? `Expected value not to be instance of TechnicalError, but it was.`
          : `Expected value to be instance of TechnicalError, but got: ${valueToCheck?.constructor?.name}`,
      pass: isInstanceOfTechnicalError,
    }
  }

  const techError: TechnicalError = valueToCheck
  const pass = techError.message.includes(expectedCode)
  return {
    message: () =>
      pass
        ? `Expected TechnicalError not to have code '${expectedCode}', but it did.`
        : `Expected TechnicalError to have code '${expectedCode}', but got: '${techError.message}'`,
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
