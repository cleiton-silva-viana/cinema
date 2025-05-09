import { MultilingualContent } from "../../../../shared/value-object/multilingual-content";

export class ImageTitle extends MultilingualContent {
  protected static readonly MIN_LENGTH: number = 8;
  protected static readonly MAX_LENGTH: number = 124;

  protected static readonly FORMAT_REGEX =
    /^[A-Za-zÀ-ÖØ-öø-ÿ\d\s\-_.,<>?!@#$%&*+\/]+$/;
}
