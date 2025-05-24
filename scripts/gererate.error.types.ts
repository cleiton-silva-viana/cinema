import { FailureTemplate } from "src/shared/failure/failures.template";

type TemplateVariable = { field: string; type: string };

/**
 * Extrai todas as variáveis de um template usando regex
 * @Example "O campo '{field:string}' deve ter entre {min:number} e {max:number}" -> [ {field: 'field', type: 'string'} ]
 * */
export function extractTemplateVariables(
  template: string,
): Array<TemplateVariable> {
  const regexp = /\{(\w+)(?::(\w+))?\}/g;
  const variables: Array<{ field: string; type: string }> = [];
  let match;

  while ((match = regexp.exec(template)) !== null) {
    const field = match[1];
    let type = match[2] || "any";

    if (!["string", "number", "Date"].includes(type)) type = "any";

    if (!variables.some((v) => v.field === field)) {
      variables.push({ field, type });
    }
  }

  return variables;
}

/**
 * Analisa um erro e retorna todas as variáveis necessárias
 * */
export function analyzeErrorTemplate(
  err: FailureTemplate,
): Array<TemplateVariable> {
  const ptVar = extractTemplateVariables(err.template.pt);
  const enVar = extractTemplateVariables(err.template.en);

  const uniqueVars = new Map<string, TemplateVariable>();

  ptVar.forEach((variable) => {
    uniqueVars.set(variable.field, variable);
  });

  enVar.forEach((variable) => {
    uniqueVars.set(variable.field, variable);
  });

  return Array.from(uniqueVars.values());
}
