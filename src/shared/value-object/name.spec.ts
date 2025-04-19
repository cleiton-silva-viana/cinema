import { Name } from './name';
import { TechnicalError } from "../error/technical.error";

describe('Name', () => {
    describe('create', () => {
        describe('should create a valid', () => {
            const successCases = [
                { name: 'john', scenario: 'with minimum length' },
                { name: 'mark', scenario: 'with another valid name' },
                { name: 'abcdefghijklmnopqrstuv', scenario: 'with maximum length' }
            ];

            successCases.forEach(({ name, scenario }) => {
                it(`Name object ${scenario}`, () => {
                    // Act
                    const result = Name.create(name);

                    // Assert
                    expect(result.value.value).toBe(name);
                });
            });
        });

        describe('should fail to create an invalid', () => {
            const failureCases = [
                { name: null as unknown as string, scenario: 'when name is null', errorCodeExpected: 'PROPERTY_CANNOT_BE_NULL' },
                { name: undefined as unknown as string, scenario: 'when name is undefined', errorCodeExpected: 'PROPERTY_CANNOT_BE_NULL' },
                { name: '', scenario: 'when name is empty', errorCodeExpected: 'FIELD_CANNOT_BE_EMPTY' },
                { name: 'ab', scenario: 'when name is too short', errorCodeExpected: 'FIELD_WITH_INVALID_SIZE' },
                { name: 'abcdefghijklmnopqrstuvwxyz', scenario: 'when name is too long', errorCodeExpected: 'FIELD_WITH_INVALID_SIZE' },
                { name: 'john123', scenario: 'when name contains invalid characters', errorCodeExpected: 'NAME_WITH_INVALID_FORMAT' },
                { name: 'John #$$', scenario: 'when name contains special characters', errorCodeExpected: 'NAME_WITH_INVALID_FORMAT' }
            ];

            failureCases.forEach(({ name, scenario, errorCodeExpected }) => {
                it(`Name object ${scenario}`, () => {
                    // Act
                    const result = Name.create(name);
                    const failures = result.failures

                    // Assert
                    expect(failures.length).toBe(1);
                    expect(failures[0].code).toBe(errorCodeExpected);
                });
            });
        });
    });

    describe('hydrate', () => {
        it('should create a Name object without validation', () => {
            // Arrange
            const nameString = 'anyname';

            // Act
            const result = Name.hydrate(nameString);

            // Assert
            expect(result).toBeInstanceOf(Name);
            expect(result.value).toBe(nameString);
        });

        it('should throw an error when name is null or undefined', () => {
            // Arrange
            const values = [null, undefined];

            // Act
            values.forEach((value) => {
                expect(() => Name.hydrate(value)).toThrow(TechnicalError);
            })
        });
    });

    describe('equal', () => {
        it('should return true when names are equal', () => {
            // Arrange
            const nameString = 'john';
            const result1 = Name.create(nameString);
            const result2 = Name.create(nameString);

            // Assert
            expect(result1.value.equal(result2.value)).toBe(true);
        });

        it('should return false when names are different', () => {
            // Arrange
            const result1 = Name.create('john');
            const result2 = Name.create('mark');

            // Assert
            expect(result1.value.equal(result2.value)).toBe(false);

        });

        it('should return false when comparing with non-Name object', () => {
            // Arrange
            const result = Name.create('john');
            const notNameObject = { name: 'john' };

            // Assert
            expect(result.value.equal(notNameObject as any)).toBe(false);
        });
    });
});