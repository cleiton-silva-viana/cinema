import {Person} from "@modules/person/entity/person";
import {PersonUID} from "@modules/person/entity/value-object/person.uid";
import {faker} from "@faker-js/faker";

export function CreateTestPerson(override?: Partial<{ uid: string, name: string, birthDate: Date }>) {
    const uid = override?.uid ?? PersonUID.create().value
    const name = override?.name ?? faker.person.firstName()
    const birthDate = override?.birthDate ?? faker.date.birthdate()

    return Person.hydrate(uid, name, birthDate)
}

export function CloneTestPersonWithOverrides(person: Person, override: Partial<{ name: string, birthDate: Date }>) {
    const {name, birthDate} = override

    return Person.hydrate(
        person.uid.value,
        name ?? person.name.value,
        birthDate ?? person.birthDate.value
    )
}