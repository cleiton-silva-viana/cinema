import { Flow } from "./assert";
import {
  greaterThanOrEqualTo,
  isBlank,
  isDateAfterLimit, isDateBeforeLimit,
  isEmpty,
  isNull,
  lessThanOrEqualTo
} from "../validator/validator";

export const not = {
  null: (
    value: string | any[] | null | undefined,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: !isNull(value),
      code,
      flow,
      details,
    });
  },

  empty: (
    value: string | any[] | null | undefined,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: !isEmpty(value),
      code,
      flow,
      details,
    });
  },

  blank: (
    value: any,
    code: string,
    details: Record<string, any> = {},
    flow: Flow = Flow.continue,
  ): Function => {
    return () => ({
      valid: !isBlank(value),
      code,
      flow,
      details
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
      valid: !lessThanOrEqualTo(value, max),
      code,
      flow,
      details: { ...details, value, max },
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
      valid: !greaterThanOrEqualTo(value, min),
      code,
      flow,
      details: { ...details, value, min },
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
      valid: !isDateAfterLimit(value, limitDate),
      code,
      flow,
      details: { ...details, value, limitDate: limitDate?.toISOString() },
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
      valid: !isDateBeforeLimit(value, limitDate),
      code,
      flow,
      details: { ...details, value, limitDate: limitDate?.toISOString() },
    });
  },
}