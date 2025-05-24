export type FailureTemplate = {
  status: number;
  title: {
    pt: string;
    en: string;
  };
  template: {
    pt?: string;
    en: string;
  };
};
