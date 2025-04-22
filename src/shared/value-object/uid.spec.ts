import { UID } from './uid';
import { v4, v7 } from 'uuid';
import {TechnicalError} from "../error/technical.error";

class TestUID extends UID {
    protected static readonly PREFIX: string = 'test';
}

describe('UID', () => {
    describe('create', () => {
        it('should create a valid UID with UUID v7', () => {
            // Act
            const uid = TestUID.create();

            // Assert
            expect(uid).toBeInstanceOf(TestUID);
            expect(uid.value).toMatch(/^test\.[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });
    });

    describe('parse', () => {
        describe('should create a valid', () => {
            it('UID object from valid string', () => {
                // Arrange
                const uuid = v7();
                const uidString = `test.${uuid}`;

                // Act
                const result = TestUID.parse(uidString);

                // Assert
                expect(result.invalid).toBe(false);
                expect(result.value).toBeInstanceOf(TestUID);
                expect(result.value.value).toBe(uidString);
            });
        });

        describe('should fail to parse an invalid', () => {
            const failureCases = [
                { 
                    value: null, 
                    scenario: 'when UID is null', 
                    errorCodeExpected: 'NULL_ARGUMENT' 
                },
                { 
                    value: undefined, 
                    scenario: 'when UID is undefined', 
                    errorCodeExpected: 'NULL_ARGUMENT' 
                },
                { 
                    value: '     ',
                    scenario: 'when UID is empty', 
                    errorCodeExpected: 'EMPTY_FIELD' 
                },
                { 
                    value: `wrongprefix.${v7()}`,
                    scenario: 'when UID has wrong prefix', 
                    errorCodeExpected: 'INVALID_UUID' 
                },
                {
                    value: `test.${v4()}`,
                    scenario: 'when UID has wrong uuid part',
                    errorCodeExpected: 'INVALID_UUID'
                },
                { 
                    value: 'test.invalid-uuid', 
                    scenario: 'when UUID part is invalid', 
                    errorCodeExpected: 'INVALID_UUID' 
                },
                { 
                    value: 'test.1234', 
                    scenario: 'when UID has wrong length', 
                    errorCodeExpected: 'INVALID_UUID' 
                }
            ];

            failureCases.forEach(({ value, scenario, errorCodeExpected }) => {
                it(`UID object ${scenario}`, () => {
                    // Act
                    const result = TestUID.parse(value);

                    // Assert
                    expect(result.invalid).toBe(true);
                    expect(result.failures[0].code).toBe(errorCodeExpected);
                });
            });
        });
    });

    describe('hydrate', () => {
        it('should create a UID object without validation', () => {
            // Arrange
            const uuid = 'not-uuid-with-format-v4-or-v4';
            const uidString = `test.${uuid}`;

            // Act
            const hydratedUID = TestUID.hydrate(uidString);

            // Assert
            expect(hydratedUID).toBeInstanceOf(TestUID);
            expect(hydratedUID.value).toBe(uidString);
        });

        it('should extract UUID part correctly even with invalid format', () => {
            // Arrange
            const invalidUUID = 'invalid-uuid';
            const uidString = `test.${invalidUUID}`;

            // Act
            const hydratedUID = TestUID.hydrate(uidString);

            // Assert
            expect(hydratedUID).toBeInstanceOf(TestUID);
            expect(hydratedUID.value).toBe(uidString);
        });

        it('shold throw error', () => {
            expect(() => TestUID.hydrate(null)).toThrow(TechnicalError)
        })
    });

    describe('equal', () => {
        it('should return true when UIDs are equal', () => {
            // Arrange
            const uuid = v7();
            const uidString = `test.${uuid}`;
            const uid1 = TestUID.hydrate(uidString);
            const uid2 = TestUID.hydrate(uidString);

            // Assert
            expect(uid1.equal(uid2)).toBe(true);
        });

        it('should return false when UIDs are different', () => {
            // Arrange
            const uid1 = TestUID.create();
            const uid2 = TestUID.create();

            // Assert
            expect(uid1.equal(uid2)).toBe(false);
        });

        it('should return false when comparing with null', () => {
            // Arrange
            const uid = TestUID.create();

            // Assert
            expect(uid.equal(null)).toBe(false);
        });

        it('should return false when comparing with non-UID object', () => {
            // Arrange
            const uid = TestUID.create();
            const notUIDObject = { value: uid.value };

            // Assert
            expect(uid.equal(notUIDObject as any)).toBe(false);
        });
    });
});