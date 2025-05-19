import { Result } from "../../../shared/result/result";
import { Person } from "../entity/person";

export interface IPersonDomainService {
  findById(uid: string): Promise<Result<Person>>;
  create(name: string, birthDate: Date): Promise<Result<Person>>;
  update(uid: string, name?: string, birthDate?: Date): Promise<Result<Person>>;
  delete(uid: string): Promise<Result<null>>;
}
