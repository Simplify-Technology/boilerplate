import type { User, UserModalActions, UserModalState, UserModalType } from '@/types/users';
import { useCallback, useReducer } from 'react';

type ModalAction =
    { type: 'OPEN'; payload: { modalType: UserModalType; user?: User } } | { type: 'CLOSE' } | { type: 'SET_PROCESSING'; payload: boolean };

const initialState: UserModalState = {
    type: null,
    isOpen: false,
    user: null,
    isProcessing: false,
};

function modalReducer(state: UserModalState, action: ModalAction): UserModalState {
    switch (action.type) {
        case 'OPEN':
            return {
                type: action.payload.modalType,
                isOpen: true,
                user: action.payload.user || null,
                isProcessing: false,
            };
        case 'CLOSE':
            return {
                ...state,
                isOpen: false,
                type: null,
                user: null,
                isProcessing: false,
            };
        case 'SET_PROCESSING':
            return {
                ...state,
                isProcessing: action.payload,
            };
        default:
            return state;
    }
}

/**
 * Hook para gerenciar estados de modais relacionados a usuários
 * Usa reducer pattern para gerenciar múltiplos estados relacionados
 */
export function useUserModals(): UserModalState & UserModalActions {
    const [state, dispatch] = useReducer(modalReducer, initialState);

    const openModal = useCallback((type: UserModalType, user?: User) => {
        dispatch({ type: 'OPEN', payload: { modalType: type, user } });
    }, []);

    const closeModal = useCallback(() => {
        dispatch({ type: 'CLOSE' });
    }, []);

    const setProcessing = useCallback((processing: boolean) => {
        dispatch({ type: 'SET_PROCESSING', payload: processing });
    }, []);

    return {
        ...state,
        openModal,
        closeModal,
        setProcessing,
    };
}
