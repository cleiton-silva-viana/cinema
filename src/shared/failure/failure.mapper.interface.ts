import { RichFailureType } from "./rich.failure.type";
import { SimpleFailure } from "./simple.failure.type";

export interface IFailureMapper {
    toRichFailure(failure: SimpleFailure, language?: 'pt' | 'en'): RichFailureType;
    toRichFailures(failures: SimpleFailure[], language?: 'pt' | 'en'): RichFailureType[];
  }