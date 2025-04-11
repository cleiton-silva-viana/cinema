import { BirthDate } from './birth.date';
import { TechnicalError } from "../../../shared/error/technical.error";

describe('BirthDate', () => {
  const originalDateNow = Date.now;

  beforeAll(() => {
    global.Date.now = jest.fn(() => new Date(2023, 0, 1).getTime());
  });

  afterAll(() => {
    global.Date.now = originalDateNow;
  });

  describe('create', () => {
    describe('should create a valid', () => {
      const successCases = [
        { 
          date: new Date(1990, 0, 1), 
          scenario: 'with date from 1990' 
        },
        { 
          date: new Date(1980, 5, 15), 
          scenario: 'with date from 1980' 
        },
        { 
          date: new Date(2000, 11, 31), 
          scenario: 'with date from 2000' 
        }
      ];

      successCases.forEach(({ date, scenario }) => {
        it(`BirthDate object ${scenario}`, () => {
          // Act
          const result = BirthDate.create(date);

          // Assert
          expect(result.invalid).toBe(false)
          expect(result.value.value.getTime()).toBe(date.getTime());
        });
      });
    });

    describe('should fail to create an invalid', () => {
      const minAge = 18;
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - minAge);
      
      const failureCases = [
        { 
          date: null, 
          scenario: 'when birth date is null', 
          errorCodeExpected: 'FIELD_CANNOT_BE_NULL' 
        },
        { 
          date: undefined, 
          scenario: 'when birth date is undefined', 
          errorCodeExpected: 'FIELD_CANNOT_BE_NULL' 
        },
        { 
          date: new Date(1899, 11, 31, 0, 0, 0, 0),
          scenario: 'when birth date is before 1900', 
          errorCodeExpected: 'DATE_IS_TOO_OLD' 
        },
        { 
          date: new Date(), 
          scenario: 'when person is under 18 years old', 
          errorCodeExpected: 'DATE_IS_TOO_YOUNG'
        }
      ];

      failureCases.forEach(({ date, scenario, errorCodeExpected }) => {
        it(`BirthDate object ${scenario}`, () => {
          // Act
          const result = BirthDate.create(date);
          const failures = result.failures;

          // Assert
          expect(failures.length).toBe(1);
          expect(failures[0].code).toBe(errorCodeExpected);
        });
      });
    });
  });

  describe('hydrate', () => {
    it('should create a BirthDate object without validation', () => {
      // Arrange
      const birthDate = new Date(1990, 0, 1);

      // Act
      const result = BirthDate.hydrate(birthDate);

      // Assert
      expect(result).toBeInstanceOf(BirthDate);
      expect(result.value.toISOString()).toBe(birthDate.toISOString());
    });

    it('should throw an error when birth date is null or undefined', () => {
      // Arrange
      const values = [null, undefined];

      // Act & Assert
      values.forEach((value) => {
        expect(() => BirthDate.hydrate(value)).toThrow(TechnicalError);
      });
    });
  });

  describe('equal', () => {
    it('should return true when birth dates are equal', () => {
      // Arrange
      const birthDate = new Date(1990, 0, 1);
      const result1 = BirthDate.create(birthDate);
      const result2 = BirthDate.create(birthDate);

      // Assert
      expect(result1.value.equal(result2.value)).toBe(true);
    });

    it('should return false when birth dates are different', () => {
      // Arrange
      const result1 = BirthDate.create(new Date(1990, 0, 1));
      const result2 = BirthDate.create(new Date(1991, 0, 1));

      // Assert
      expect(result1.value.equal(result2.value)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      // Arrange
      const result = BirthDate.create(new Date(1990, 0, 1));

      // Assert
      expect(result.value.equal(null as unknown as BirthDate)).toBe(false);
    });

    it('should return false when comparing with non-BirthDate object', () => {
      // Arrange
      const result = BirthDate.create(new Date(1990, 0, 1));
      const notBirthDateObject = { value: new Date(1990, 0, 1) };

      // Assert
      expect(result.value.equal(notBirthDateObject as unknown as BirthDate)).toBe(false);
    });
  });
});