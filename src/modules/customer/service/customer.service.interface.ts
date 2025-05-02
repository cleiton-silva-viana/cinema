import { Result } from "src/shared/result/result";
import { Customer } from "../entity/customer";

export type CreateCustomerProps = {
  name: string;
  birthDate: Date;
  email: string;
};

export type UpdateCustomerProps = {
  name?: string;
  birthDate?: Date;
  email?: string;
};

export interface ICustomerService {
  findByEmail(email: string): Promise<Result<Customer>>;
  findById(uid: string): Promise<Result<Customer>>;
  create(user: CreateCustomerProps): Promise<Result<Customer>>;
  update(uid: string, props: UpdateCustomerProps): Promise<Result<Customer>>;
  delete(uid: string): Promise<Result<null>>;
}
