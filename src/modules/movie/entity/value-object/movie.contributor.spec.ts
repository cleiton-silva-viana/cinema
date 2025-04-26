import { faker } from '@faker-js/faker/locale/pt_PT';
import { MovieContributor, PersonRole } from './movie.contributor';
import { PersonUID } from '../../../person/value-object/person.uid';
import { MovieUID } from "./movie.uid";
import { CustomerUID } from "../../../customer/entity/value-object/customer.uid";

describe('MovieContributor', () => {
  const personUid = PersonUID.create().value;
  const movieUid = MovieUID.create().value;
  const role = faker.helpers.arrayElement(Object.values(PersonRole));

  describe('Static Methods', () => {
    describe('create', () => {
      it('deve criar um vínculo válido', () => {
        // Act
        const result = MovieContributor.create(personUid, movieUid, role);
        
        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.personUid.value).toBe(personUid);
        expect(result.value.movieUid.value).toBe(movieUid);
        expect(result.value.role).toBe(role);
      });

      it.each([
        { scenario: 'personUid for inválido', personUid: null, movieUid, role },
        { scenario: 'movieUid for inválido', personUid, movieUid: CustomerUID.create().value, role },
        { scenario: 'role for inválido', personUid, movieUid, role: undefined },
      ])('deve falhar se $scenario', ({ personUid, movieUid, role }) => {
        // Act
        const result = MovieContributor.create(personUid, movieUid, role);
       
        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe('INVALID_PERSON_MOVIE_ROLE');
      });
    });

    describe('hydrate', () => {
      it('deve hidratar um vínculo corretamente', () => {
        // Act
        const hydrated = MovieContributor.hydrate(personUid, movieUid, role);
        
        // Assert
        expect(hydrated.personUid.value).toBe(personUid);
        expect(hydrated.movieUid.value).toBe(movieUid);
        expect(hydrated.role).toBe(role);
      });

      it.each([
        { scenario: 'personUid inválido', personUid: null, movieUid, role },
        { scenario: 'movieUid inválido', personUid, movieUid: null, role },
        { scenario: 'role inválido', personUid, movieUid, role: null },
        { scenario: '2 parâmetros inválidos', personUid: undefined, movieUid, role: undefined },
        { scenario: '3 parâmetros inválidos', personUid: undefined, movieUid: undefined, role: null },
      ])('deve lançar erro técnico se $scenario', ({ personUid, movieUid, role }) => {
        // Assert
        expect(() => MovieContributor.hydrate(personUid, movieUid, role))
          .toThrow('INVALID_PARAMS');
      });
    });
  });
});
