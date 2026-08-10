import { fetchViaCep } from '@/utils/via-cep';
import { afterEach, describe, expect, it, vi } from 'vitest';

function mockFetchOnce(payload: unknown, ok = true) {
    const fn = vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(payload) });
    vi.stubGlobal('fetch', fn);
    return fn;
}

describe('utils/via-cep — lookup best-effort', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('mapeia a resposta do ViaCEP (localidade → cidade)', async () => {
        mockFetchOnce({ logradouro: 'Rua Pedro de Alcântara', bairro: 'Centro', localidade: 'Iporanga', uf: 'SP' });

        const result = await fetchViaCep('18302-000');

        expect(result).toEqual({ logradouro: 'Rua Pedro de Alcântara', bairro: 'Centro', cidade: 'Iporanga', uf: 'SP' });
    });

    it('CEP com menos de 8 dígitos não dispara fetch e devolve null', async () => {
        const fn = mockFetchOnce({});

        expect(await fetchViaCep('1830')).toBeNull();
        expect(fn).not.toHaveBeenCalled();
    });

    it('resposta { erro: true } do ViaCEP devolve null (CEP inexistente)', async () => {
        mockFetchOnce({ erro: true });

        expect(await fetchViaCep('99999999')).toBeNull();
    });

    it('resposta { erro: "true" } como string também devolve null', async () => {
        mockFetchOnce({ erro: 'true' });

        expect(await fetchViaCep('99999999')).toBeNull();
    });

    it('falha de rede é silenciosa — devolve null, nunca lança', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

        await expect(fetchViaCep('18302000')).resolves.toBeNull();
    });

    it('HTTP não-ok devolve null', async () => {
        mockFetchOnce({}, false);

        expect(await fetchViaCep('18302000')).toBeNull();
    });

    it('campos ausentes na resposta viram string vazia', async () => {
        mockFetchOnce({ localidade: 'São Paulo', uf: 'SP' });

        expect(await fetchViaCep('01001000')).toEqual({ logradouro: '', bairro: '', cidade: 'São Paulo', uf: 'SP' });
    });
});
