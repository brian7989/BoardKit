import { useContext } from 'react';
import { StackPickerContext, type StackPickerContextValue } from './StackPickerContext.js';

export function useStackPicker(): StackPickerContextValue | null {
  return useContext(StackPickerContext);
}
