import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import type { RootState, AppDispatch } from "../store";

/**
 * Typed wrapper for `useDispatch` to ensure specific AppDispatch type.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Typed wrapper for `useSelector` to ensure RootState access.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
