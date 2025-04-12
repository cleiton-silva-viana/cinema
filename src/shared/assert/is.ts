import {
  greaterThanOrEqualTo,
  isBetween,
  isDateAfterLimit,
  isDateBeforeLimit,
  isEmail,
  isEqual,
  isMatch,
  isUIDv4,
  isUIDv7,
  lessThanOrEqualTo,
} from "../validator/validator";
import { Flow } from "./assert";

export const is = {

  // TODO: criar testes
  true: (
    value: boolean,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue
  ): Function => {
    return () => ({
      valid: value,
      code,
      flow,
      details
    })
  },

  equal: (
    value: any,
    target: any,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: isEqual(value, target),
      code,
      flow,
      details: {
        ...details,
        value: JSON.stringify(value),
        target: JSON.stringify(target)
      },
    });
  },

  between: (
    value: number | string | Array<any>,
    min: number,
    max: number,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: isBetween(value, min, max),
      code,
      flow,
      details: { ...details, value: JSON.stringify(value), min, max },
    });
  },

  lessOrEqualTo: (
    value: number | string | any[] | object | null | undefined,
    max: number,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: lessThanOrEqualTo(value, max),
      code,
      flow,
      details: { ...details, value: JSON.stringify(value), max },
    });
  },

  greaterOrEqualTo: (
    value: number | string | any[] | object | null | undefined,
    min: number,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: greaterThanOrEqualTo(value, min),
      code,
      flow,
      details: { ...details, value: JSON.stringify(value), min },
    });
  },

  match: (
    value: string | null | undefined,
    regExp: RegExp,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: isMatch(regExp, value),
      code,
      flow,
      details,
    });
  },

  email: (
    value: string | null | undefined,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: isEmail(value),
      code,
      flow,
      details,
    });
  },

  uidV4: (
    value: string | null | undefined,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: isUIDv4(value),
      code,
      flow,
      details,
    });
  },

  uidV7: (
    value: string | null | undefined,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: isUIDv7(value),
      code,
      flow,
      details,
    });
  },

  dateAfter: (
    value: Date,
    limitDate: Date,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: isDateAfterLimit(value, limitDate),
      code,
      flow,
      details: { ...details, value: value.toISOString(), limitDate: limitDate?.toISOString() },
    });
  },

  dateBefore: (
    value: Date,
    limitDate: Date,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: isDateBeforeLimit(value, limitDate),
      code,
      flow,
      details: { ...details, value: value.toISOString(), limitDate: limitDate?.toISOString() },
    });
  },
};
