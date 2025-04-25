import { MultilingualContent } from "../../../../shared/value-object/multilingual-content";

export class MovieDescription extends MultilingualContent {
    protected static readonly MIN_LENGTH: number = 48;
    protected static readonly MAX_LENGTH: number = 1024;
    protected static readonly FORMAT_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\d\s\-_.,?!@#$%&+\/]+$/
}
