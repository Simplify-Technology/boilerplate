import { removeNonNumeric } from '@/utils/format/masks';

export interface ViaCepResult {
    logradouro: string;
    bairro: string;
    cidade: string;
    uf: string;
}

/**
 * Lookup best-effort no ViaCEP: digitou o CEP → logradouro/bairro/cidade/UF
 * preenchem sozinhos no formulário.
 *
 * Fail-soft por contrato: CEP inválido, timeout (4s), rede fora ou `erro: true`
 * do ViaCEP devolvem `null` e o usuário preenche na mão — o lookup é
 * conveniência, nunca bloqueio. Sem retry/circuit breaker de propósito: é
 * chamada client-side de preenchimento, não integração de backend.
 */
export async function fetchViaCep(cep: string): Promise<ViaCepResult | null> {
    const digits = removeNonNumeric(cep);
    if (digits.length !== 8) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
        const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        });

        if (!response.ok) return null;

        const data: { erro?: boolean | string; logradouro?: string; bairro?: string; localidade?: string; uf?: string } = await response.json();

        // O ViaCEP responde a flag ora como boolean true, ora como string "true";
        // truthy cobre as duas formas.
        if (data.erro) return null;

        return {
            logradouro: data.logradouro ?? '',
            bairro: data.bairro ?? '',
            cidade: data.localidade ?? '',
            uf: data.uf ?? '',
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}
