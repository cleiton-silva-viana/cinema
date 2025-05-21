import { RichFailure } from "./rich.failure.type";
import { SimpleFailure } from "./simple.failure.type";

export interface IFailureMapper {
  toRichFailure(failure: SimpleFailure, language?: "pt" | "en"): RichFailure;
  toRichFailures(
    failures: SimpleFailure[],
    language?: "pt" | "en",
  ): RichFailure[];
}
