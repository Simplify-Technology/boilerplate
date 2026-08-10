/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />

declare global {
    // Mock simplificado do helper Ziggy usado nos testes (ver setup.ts).
    // Permissivo de propósito: o `route` real (Ziggy) aceita number/objeto e o
    // app inteiro é tipado por ele em types/global.d.ts.
    var route: (name: string, params?: any) => string;
}

export {};
