import { Result } from '@shared/result/result'
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
      toBeValidResultWithValue(expectedValue: any): R
      toBeValidResultMatching<T>(predicate: (value: T) => boolean | void): R
      toBeInvalidResult(): R
      toBeInvalidResultWithSingleFailure(expectedCode: FailureCode): R
      toBeInvalidResultWithFailureCount(expectedCount: number): R
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
 * Matcher para verificar se um Result é válido e contém um valor primitivo específico
 * */
function toBeValidResultWithValue(received: Result<any>, expectedValue: any) {
  if (received.isInvalid()) {
    const failures = received.failures.map((f) => f.code)
    return {
      message: () =>
        matcherHint('.toBeValidResultWithValue', 'received', 'expectedValue') +
        '\n\n' +
        'Expected Result to be valid with value:\n' +
        '  ' +
        printExpected(expectedValue) +
        '\n' +
        'But Result was invalid with failures:\n' +
        '  ' +
        printReceived(failures),
      pass: false,
    }
  }

  const actualValue = received.value
  const pass = Object.is(actualValue, expectedValue)

  if (pass) {
    return {
      message: () =>
        matcherHint('.not.toBeValidResultWithValue', 'received', 'expectedValue') +
        '\n\n' +
        'Expected Result not to have value:\n' +
        '  ' +
        printExpected(expectedValue) +
        '\n' +
        'But received:\n' +
        '  ' +
        printReceived(actualValue),
      pass: true,
    }
  } else {
    return {
      message: () =>
        matcherHint('.toBeValidResultWithValue', 'received', 'expectedValue') +
        '\n\n' +
        'Expected Result to have value:\n' +
        '  ' +
        printExpected(expectedValue) +
        '\n' +
        'Received:\n' +
        '  ' +
        printReceived(actualValue),
      pass: false,
    }
  }
}

/**
 * Matcher para verificar se um Result é válido e executa validações customizadas
 */
function toBeValidResultMatching<T>(received: Result<T>, predicate: (value: T) => void | boolean) {
  if (received.isInvalid()) {
    const failures = received.failures.map((f) => f.code).join(', ')
    return {
      message: () =>
        matcherHint('.toBeValidResultMatching', 'received', 'predicate') +
        '\n\n' +
        'Expected Result to be valid and match predicate, but it was invalid\n' +
        'Failures: ' +
        printReceived(`[${failures}]`),
      pass: false,
    }
  }

  try {
    const result = predicate(received.value)
    if (result === false) {
      return {
        message: () =>
          matcherHint('.not.toBeValidResultMatching', 'received', 'predicate') +
          '\n\n' +
          'Expected Result value not to match predicate, but it did\n' +
          'Received value:' +
          printReceived(received.value),
        pass: true,
      }
    }

    return {
      message: () =>
        matcherHint('.not.toBeValidResultMatching', 'received', 'predicate') +
        '\n\n' +
        'Expected Result value not to match predicate, but it did\n' +
        'Received value: ' +
        printReceived(received.value),
      pass: true,
    }
  } catch (error) {
    return {
      message: () =>
        matcherHint('.toBeValidResultMatching', 'received', 'predicate') +
        '\n\n' +
        'Expected predicate to execute without errors, but it threw:\n' +
        printReceived(error),
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
 * Matcher para verificar se um Result é inválido e contém apenas uma falha com código específico
 */
function toBeInvalidResultWithSingleFailure(received: Result<any>, expectedCode: FailureCode) {
  if (received.isValid()) {
    return {
      message: () =>
        matcherHint('.toBeInvalidResultWithSingleFailure', 'received', 'expectedCode') +
        '\n\n' +
        'Expected Result to be invalid with single failure code:\n' +
        '  ' +
        printExpected(expectedCode) +
        '\n' +
        'But Result was valid with value:\n' +
        '  ' +
        printReceived(received.value),
      pass: false,
    }
  }

  const failures = received.failures
  const actualCodes = failures.map((f) => f.code)

  if (failures.length !== 1) {
    return {
      message: () =>
        matcherHint('.toBeInvalidResultWithSingleFailure', 'received', 'expectedCode') +
        '\n\n' +
        'Expected Result to have exactly 1 failure, but got ' +
        failures.length +
        ' failures:\n' +
        '  ' +
        printReceived(actualCodes) +
        '\n' +
        'Expected single failure code:\n' +
        '  ' +
        printExpected(expectedCode),
      pass: false,
    }
  }

  const actualCode = failures[0].code
  const pass = actualCode === expectedCode

  if (pass) {
    return {
      message: () =>
        matcherHint('.not.toBeInvalidResultWithSingleFailure', 'received', 'expectedCode') +
        '\n\n' +
        'Expected Result not to have single failure with code:\n' +
        '  ' +
        printExpected(expectedCode) +
        '\n' +
        'But received:\n' +
        '  ' +
        printReceived(actualCode),
      pass: true,
    }
  } else {
    return {
      message: () =>
        matcherHint('.toBeInvalidResultWithSingleFailure', 'received', 'expectedCode') +
        '\n\n' +
        'Expected Result to have single failure with code:\n' +
        '  ' +
        printExpected(expectedCode) +
        '\n' +
        'Received:\n' +
        '  ' +
        printReceived(actualCode),
      pass: false,
    }
  }
}

/**
 * Matcher para verificar se um Result é inválido e contém uma quantidade específica de falhas
 */
function toBeInvalidResultWithFailureCount(received: Result<any>, expectedCount: number) {
  if (received.isValid()) {
    return {
      message: () =>
        matcherHint('.toBeInvalidResultWithFailureCount', 'received', 'expectedCount') +
        '\n\n' +
        'Expected Result to be invalid with ' +
        expectedCount +
        ' failure(s), but Result was valid with value:\n' +
        '  ' +
        printReceived(received.value),
      pass: false,
    }
  }

  const failures = received.failures
  const actualCount = failures.length
  const pass = actualCount === expectedCount

  if (pass) {
    return {
      message: () =>
        matcherHint('.not.toBeInvalidResultWithFailureCount', 'received', 'expectedCount') +
        '\n\n' +
        'Expected Result not to have ' +
        expectedCount +
        ' failure(s), but it did\n' +
        'Received failures: ' +
        printReceived(failures.map((f) => f.code)),
      pass: true,
    }
  } else {
    return {
      message: () =>
        matcherHint('.toBeInvalidResultWithFailureCount', 'received', 'expectedCount') +
        '\n\n' +
        'Expected Result to have ' +
        expectedCount +
        ' failure(s), but got ' +
        actualCount +
        ' failure(s)\n' +
        'Received failures: ' +
        printReceived(failures.map((f) => f.code)),
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
    toThrowTechnicalError,
    toHaveTechnicalErrorCode,
    toBeValidResultMatching,
    toBeValidResultWithValue,
    toBeInvalidResultWithSingleFailure,
    toBeInvalidResultWithFailureCount,
  })
}
