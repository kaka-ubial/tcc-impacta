export const DIAS = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
];

const HORA_MIN = 6;
const HORA_MAX = 22;

export const HORAS = Array.from(
    { length: (HORA_MAX - HORA_MIN) * 2 + 1 },
    (_, i) => {
        const h = String(HORA_MIN + Math.floor(i / 2)).padStart(2, '0');

        return `${h}:${i % 2 === 0 ? '00' : '30'}`;
    },
);
