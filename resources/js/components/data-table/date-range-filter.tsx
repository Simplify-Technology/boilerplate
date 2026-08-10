import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { shiftISODate, todayISO } from '@/utils/data-table/date';

export type DateRange = {
    from: string | null;
    to: string | null;
};

export type DateRangeFilterProps = {
    /** Datas em `yyyy-mm-dd`; `null` = ponta aberta. */
    from: string | null;
    to: string | null;
    /**
     * Recebe o intervalo INTEIRO, e não cada campo: os atalhos mexem nas duas
     * pontas de uma vez, e mandar duas mudanças seguidas geraria duas
     * navegações — a primeira delas para um intervalo que ninguém pediu.
     */
    onChange: (range: DateRange) => void;
    label?: string;
    fromId?: string;
    toId?: string;
    className?: string;
};

/**
 * Quantos dias o atalho cobre, contando HOJE.
 *
 * "7 dias" é hoje mais os seis anteriores, e não uma janela rolante de 168
 * horas: com janela rolante o mesmo registro entra e sai do recorte conforme a
 * hora em que a página é aberta.
 */
const SHORTCUTS = [
    { key: 'today', label: 'Hoje', days: 1 },
    { key: '7d', label: '7 dias', days: 7 },
    { key: '30d', label: '30 dias', days: 30 },
] as const;

/**
 * Par De/Até com atalhos de período.
 *
 * Amarra o intervalo pelos próprios `min`/`max` dos campos: sem isso dá para
 * pedir 30/08 → 01/01 e receber uma lista vazia sem explicação. O "Até" não
 * passa de hoje, porque registro com data futura não existe em listagem.
 */
export function DateRangeFilter({ from, to, onChange, label = 'Período', fromId = 'from', toId = 'to', className }: DateRangeFilterProps) {
    const today = todayISO();

    const rangeFor = (days: number): DateRange => ({ from: shiftISODate(today, -(days - 1)), to: today });

    // Qual atalho descreve o intervalo que está na tela. Sem isto o grupo nunca
    // acende, e quem clicou em "7 dias" não sabe que continua nele.
    const active = SHORTCUTS.find((shortcut) => {
        const range = rangeFor(shortcut.days);

        return range.from === from && range.to === to;
    });

    const handleShortcut = (key: string) => {
        const shortcut = SHORTCUTS.find((candidate) => candidate.key === key);

        // Radix manda string vazia quando se clica no item já ativo. Isso é
        // "desmarcar", e desmarcar um atalho não é pedir para limpar o período
        // — quem quer limpar usa o `×` do campo ou o "Limpar filtros".
        if (!shortcut) {
            return;
        }

        onChange(rangeFor(shortcut.days));
    };

    return (
        <div className={cn('space-y-1', className)}>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <Label className="text-xs">{label}</Label>
                <ToggleGroup type="single" variant="outline" value={active?.key ?? ''} onValueChange={handleShortcut} aria-label="Atalhos de período">
                    {SHORTCUTS.map((shortcut) => (
                        <ToggleGroupItem key={shortcut.key} value={shortcut.key} className="h-7 px-2 text-xs">
                            {shortcut.label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <DateInput
                    id={fromId}
                    size="sm"
                    clearable
                    aria-label="Data inicial"
                    value={from}
                    max={to ?? today}
                    onChange={(value) => onChange({ from: value, to })}
                />
                <DateInput
                    id={toId}
                    size="sm"
                    clearable
                    aria-label="Data final"
                    value={to}
                    min={from ?? undefined}
                    max={today}
                    onChange={(value) => onChange({ from, to: value })}
                />
            </div>
        </div>
    );
}
