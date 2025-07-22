import { TechnicalError } from '@shared/error/technical.error'

/**
 * Helper function to test that required fields throw TechnicalError when missing
 * @param hydrateFunction - The hydrate function to test
 * @param validInput - A valid input object
 * @param requiredFields - Array of field names that are required
 */
export function testRequiredFields<T extends Record<string, any>>(
  hydrateFunction: (input: T) => any,
  validInput: T,
  requiredFields: (keyof T)[]
): void {
  requiredFields.forEach((field) => {
    it(`deve lançar TechnicalError se ${String(field)} estiver ausente no hydrate`, () => {
      // Arrange
      const incompleteProps = { ...validInput }
      delete incompleteProps[field]

      // Act & Assert
      expect(() => hydrateFunction(incompleteProps as any)).toThrow(TechnicalError)
    })
  })
}
