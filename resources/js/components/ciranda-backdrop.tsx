import { cn } from '@/lib/utils';

// Roda de ciranda: figuras de mãos dadas ao redor de um círculo, em silhueta.
// Geometria no referencial de uma figura "de pé" apontando para cima (y negativo
// é para fora da roda); cada figura é rotacionada para sua posição.
const FIGURAS = 12;
const R = 100;
const PASSO = 360 / FIGURAS;
const MEIO_PASSO = Math.PI / FIGURAS;
const MAO_RAIO = R + 46;
const MAO_X = MAO_RAIO * Math.sin(MEIO_PASSO);
const MAO_Y = -MAO_RAIO * Math.cos(MEIO_PASSO);
const CORES = ['var(--brand)', 'var(--brand-green)'];

const corpo = `M -7 ${-(R + 54)} Q 0 ${-(R + 57)} 7 ${-(R + 54)} L 4.5 ${-(R + 40)} L 17 ${-(R + 6)} Q 0 ${-(R + 2)} -17 ${-(R + 6)} L -4.5 ${-(R + 40)} Z`;
const bracos = [1, -1]
    .map(
        (lado) =>
            `M ${7 * lado} ${-(R + 52)} Q ${24 * lado} ${-(R + 53)} ${MAO_X * lado} ${MAO_Y}`,
    )
    .join(' ');

function Roda({ className }: { className?: string }) {
    return (
        <svg
            viewBox="-180 -180 360 360"
            className={cn('absolute aspect-square', className)}
        >
            <circle
                r={R - 10}
                fill="none"
                stroke="var(--brand)"
                strokeWidth="1.5"
                strokeDasharray="1 7"
                strokeLinecap="round"
            />
            {Array.from({ length: FIGURAS }, (_, i) => (
                <g
                    key={i}
                    transform={`rotate(${i * PASSO})`}
                    fill={CORES[i % CORES.length]}
                    stroke={CORES[i % CORES.length]}
                >
                    <circle cy={-(R + 66)} r="8.5" stroke="none" />
                    <path d={corpo} stroke="none" />
                    <path
                        d={bracos}
                        fill="none"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                </g>
            ))}
        </svg>
    );
}

export function CirandaBackdrop() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit] bg-[radial-gradient(56rem_36rem_at_100%_0%,color-mix(in_oklch,var(--brand-soft)_80%,transparent),transparent_70%),radial-gradient(48rem_32rem_at_0%_100%,color-mix(in_oklch,var(--brand-green)_9%,transparent),transparent_70%)]"
        >
            <Roda className="-top-44 -right-52 w-[min(44rem,130vw)] animate-[impacta-ciranda-spin_240s_linear_infinite] opacity-[0.09] motion-reduce:animate-none dark:opacity-[0.13]" />
            <Roda className="-bottom-60 -left-44 w-[min(34rem,100vw)] animate-[impacta-ciranda-spin_320s_linear_infinite_reverse] opacity-[0.06] motion-reduce:animate-none dark:opacity-[0.1]" />
        </div>
    );
}
