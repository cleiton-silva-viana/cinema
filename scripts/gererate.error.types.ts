/**
 * Extrai todas as variáveis de um template usando regex
 * @Example "O campo '{field:string}' deve ter entre {min:number} e {max:number}" -> [ {field: 'field', type: 'string'} ]
 * */
export function extractTemplateVariables(
  template: string,
): Array<{ field: string; type: string }> {
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
