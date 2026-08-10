// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolveDetectTlsHost, resolveDevServerConfig } from '../../../vite.config';

describe('resolveDevServerConfig', () => {
    it('does not force a dev server override from APP_URL alone', () => {
        expect(
            resolveDevServerConfig('serve', {
                APP_URL: 'https://boilerplate.test',
            }),
        ).toBeUndefined();
    });

    it('returns no dev server config outside serve mode', () => {
        expect(
            resolveDevServerConfig('build', {
                VITE_DEV_SERVER_URL: 'http://localhost:5173',
            }),
        ).toBeUndefined();
    });

    it('builds the HMR configuration from an explicit dev server URL', () => {
        expect(
            resolveDevServerConfig('serve', {
                VITE_DEV_SERVER_URL: 'https://vite.boilerplate.test:5173',
            }),
        ).toEqual({
            host: true,
            port: 5173,
            strictPort: true,
            hmr: {
                host: 'vite.boilerplate.test',
                protocol: 'wss',
                port: 5173,
                clientPort: 5173,
            },
        });
    });

    it('defaults to port 5173 when the URL has no explicit port', () => {
        expect(
            resolveDevServerConfig('serve', {
                VITE_DEV_SERVER_URL: 'http://vite.boilerplate.test',
            }),
        ).toMatchObject({
            port: 5173,
            hmr: { protocol: 'ws', clientPort: 5173 },
        });
    });
});

describe('resolveDetectTlsHost', () => {
    it('uses the secured application host for Herd or Valet TLS detection', () => {
        expect(
            resolveDetectTlsHost({
                APP_URL: 'https://boilerplate.test',
            }),
        ).toBe('boilerplate.test');
    });

    it('ignores non-https application URLs', () => {
        expect(
            resolveDetectTlsHost({
                APP_URL: 'http://localhost:8000',
            }),
        ).toBeUndefined();
    });

    it('ignores an empty APP_URL', () => {
        expect(resolveDetectTlsHost({})).toBeUndefined();
        expect(resolveDetectTlsHost({ APP_URL: '   ' })).toBeUndefined();
    });

    it('tolerates an APP_URL without scheme instead of crashing the config', () => {
        expect(resolveDetectTlsHost({ APP_URL: 'myapp.test' })).toBeUndefined();
        expect(resolveDetectTlsHost({ APP_URL: 'localhost' })).toBeUndefined();
    });
});

describe('malformed URLs never crash the config', () => {
    it('resolveDevServerConfig ignores an unparsable VITE_DEV_SERVER_URL', () => {
        expect(resolveDevServerConfig('serve', { VITE_DEV_SERVER_URL: 'not a url' })).toBeUndefined();
        expect(resolveDevServerConfig('serve', { VITE_DEV_SERVER_URL: 'http://' })).toBeUndefined();
    });
});
