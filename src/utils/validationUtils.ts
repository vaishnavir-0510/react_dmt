import type { CleanupFunctionParameter, CleanupFunctionValidation } from "../types";

// utils/validationUtils.ts
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateField = (
  value: any,
  validations: CleanupFunctionValidation[]
): ValidationResult => {
  const errors: string[] = [];

  for (const validation of validations) {
    switch (validation.rule) {
      case 'not_null':
        if (validation.value === 'true' && (!value && value !== 0 && value !== false)) {
          errors.push(validation.message);
        }
        break;

      case 'min':
        if (value !== undefined && value !== null && value !== '') {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue < Number(validation.value)) {
            errors.push(validation.message);
          }
        }
        break;

      case 'max_length':
        if (value && value.length > Number(validation.value)) {
          errors.push(validation.message);
        }
        break;

      case 'regex':
        if (value && validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            errors.push(validation.message);
          }
        }
        break;

      case 'in':
        if (value && Array.isArray(validation.value) && !validation.value.includes(value)) {
          errors.push(validation.message);
        }
        break;

      default:
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateForm = (formData: Record<string, any>, parameters: CleanupFunctionParameter[]): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  parameters.forEach(param => {
    if (!param.optional || formData[param.attribute]) {
      const validationResult = validateField(formData[param.attribute], param.validation);
      if (!validationResult.isValid) {
        errors[param.attribute] = validationResult.errors;
      }
    }
  });

  return errors;
};