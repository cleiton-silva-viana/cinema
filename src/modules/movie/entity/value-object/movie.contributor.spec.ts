import { faker } from '@faker-js/faker/locale/pt_PT';
import { MovieContributor, PersonRole } from './movie.contributor';
import { PersonUID } from '../../../person/value-object/person.uid';
import { MovieUID } from "./movie.uid";

describe('MovieContributor', () => {
  const personUid = PersonUID.create();
  const movieUid = MovieUID.create();
  const role = faker.helpers.arrayElement(Object.values(PersonRole));

  describe('Static Methods', () => {
    describe('create', () => {
      it('deve criar um vínculo válido', () => {
        // Act
        const result = MovieContributor.create(personUid, movieUid, role);
        
        // Assert
        expect(result.invalid).toBe(false);
        expect(result.value.personUid.value).toBe(personUid.value);
        expect(result.value.movieUid.value).toBe(movieUid.value);
        expect(result.value.role).toBe(role);
      });

      it.each([
        { scenario: 'personUid for nulo', personUid: null, movieUid, role },
        { scenario: 'movieUid for nulo', personUid, movieUid: null, role },
        { scenario: 'role for nulo', personUid, movieUid, role: null },
      ])('deve falhar se $scenario', ({ personUid, movieUid, role }) => {
        // Arrange
        const p = typeof personUid === 'function' ? personUid() : personUid;
        const m = typeof movieUid === 'function' ? movieUid() : movieUid;
        const r = typeof role === 'function' ? role() : role;
        
        // Act
        const result = MovieContributor.create(p, m, r);
       
        // Assert
        expect(result.invalid).toBe(true);
        expect(result.failures[0].code).toBe('INVALID_PERSON_MOVIE_ROLE');
      });
    });

    describe('hydrate', () => {
      it('deve hidratar um vínculo corretamente', () => {
        // Act
        const hydrated = MovieContributor.hydrate(personUid.value, movieUid.value, role);
        
        // Assert
        expect(hydrated.personUid.value).toBe(personUid.value);
        expect(hydrated.movieUid.value).toBe(movieUid.value);
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
