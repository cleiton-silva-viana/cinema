import { Result } from "src/shared/result/result";
import { Customer } from "../entity/customer";

export interface ICreateCustomerProps {
  name: string;
  birthDate: Date;
  email: string;
};

export interface IUpdateCustomerProps {
  name?: string
  birthDate?: Date;
  email?: string;
};

export interface ICustomerDomainService {
  findByEmail(email: string): Promise<Result<Customer>>;
  findById(uid: string): Promise<Result<Customer>>;
  create(user: ICreateCustomerProps): Promise<Result<Customer>>;
  update(uid: string, props: IUpdateCustomerProps): Promise<Result<Customer>>;
  delete(uid: string): Promise<Result<boolean>>;
}
