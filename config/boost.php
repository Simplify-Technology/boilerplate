<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| Laravel Boost — o que diverge do default do pacote
|--------------------------------------------------------------------------
|
| O Boost mescla este arquivo com o config do pacote (mergeConfigFrom), então
| só o que muda entra aqui.
|
| Guidelines do Claude Code apontam para o AGENTS.md. O default do agente
| `claude_code` é CLAUDE.md, e o GuidelineWriter APENDE o bloco
| <laravel-boost-guidelines> ao fim do arquivo quando não acha o marcador:
| cada `boost:update` colaria 280 linhas no CLAUDE.md. O CLAUDE.md importa o
| AGENTS.md com `@AGENTS.md`, e Cursor, Codex e Copilot já leem o AGENTS.md por
| default — um arquivo gerado, lido por todas as ferramentas.
|
*/

return [
    'agents' => [
        'claude_code' => [
            'guidelines_path' => 'AGENTS.md',
        ],
    ],
];
