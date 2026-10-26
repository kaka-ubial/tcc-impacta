#!/usr/bin/env python3
"""Mede quão distinguíveis são as cores de status/gráficos do Impacta para
quem tem daltonismo, comparando a paleta padrão com a do modo daltônico.

Método: converte OKLCH -> sRGB, simula protanopia/deuteranopia/tritanopia com
as matrizes de Machado, Oliveira e Fernandes (2009, severidade 1.0, em RGB
linear) e calcula a diferença de cor CIEDE2000 (ΔE00) entre cada par.
Regra de bolso: ΔE00 < 10 = pares fáceis de confundir; >= 20 = claramente
distintos. É uma SIMULAÇÃO: não substitui o teste com pessoas.

Uso: python3 simular_daltonismo.py [--md]
"""
import math, sys, itertools

def oklch_to_srgb(L, C, h):
    a = C * math.cos(math.radians(h)); b = C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return [min(1, max(0, v)) for v in (r, g, bl)]  # linear

def to_gamma(v): return 12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055

MACHADO = {
    'protanopia': [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    'deuteranopia': [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
    'tritanopia': [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
}

def simulate(rgb_lin, kind):
    if kind == 'normal': return rgb_lin
    M = MACHADO[kind]
    return [min(1, max(0, sum(M[i][j] * rgb_lin[j] for j in range(3)))) for i in range(3)]

def lin_to_lab(rgb):
    r, g, b = rgb
    X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
    Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    Z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b
    xr, yr, zr = X / 0.95047, Y / 1.0, Z / 1.08883
    f = lambda t: t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    fx, fy, fz = f(xr), f(yr), f(zr)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)

def de2000(l1, l2):
    L1, a1, b1 = l1; L2, a2, b2 = l2
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2); Cb = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360; h2p = math.degrees(math.atan2(b2, a2p)) % 360
    dL = L2 - L1; dC = C2p - C1p
    dh = 0 if C1p * C2p == 0 else (h2p - h1p + 540) % 360 - 180
    dH = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dh / 2))
    Lb, Cpb = (L1 + L2) / 2, (C1p + C2p) / 2
    if C1p * C2p == 0: hb = h1p + h2p
    elif abs(h1p - h2p) <= 180: hb = (h1p + h2p) / 2
    else: hb = (h1p + h2p + 360) / 2 if h1p + h2p < 360 else (h1p + h2p - 360) / 2
    T = 1 - 0.17 * math.cos(math.radians(hb - 30)) + 0.24 * math.cos(math.radians(2 * hb)) + 0.32 * math.cos(math.radians(3 * hb + 6)) - 0.20 * math.cos(math.radians(4 * hb - 63))
    dth = 30 * math.exp(-(((hb - 275) / 25) ** 2))
    Rc = 2 * math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lb - 50) ** 2 / math.sqrt(20 + (Lb - 50) ** 2)
    Sc, Sh = 1 + 0.045 * Cpb, 1 + 0.015 * Cpb * T
    Rt = -math.sin(math.radians(2 * dth)) * Rc
    return math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh))

# Tokens de app.css (OKLCH). "chart" = o que estatisticas.tsx usa; "status" = badges.
PALETAS = {
    'Padrão (claro)': {
        'Marca (teal)': (0.511, 0.086, 186), 'Sucesso (verde)': (0.571, 0.071, 152),
        'Pendente (âmbar)': (0.76, 0.13, 73), 'Erro (vermelho)': (0.63, 0.20, 27),
        'Neutro': (0.45, 0.03, 230)},
    'Padrão (escuro)': {
        'Marca (teal)': (0.785, 0.133, 182), 'Sucesso (verde)': (0.65, 0.065, 152),
        'Pendente (âmbar)': (0.76, 0.13, 73), 'Erro (vermelho)': (0.63, 0.20, 27),
        'Neutro': (0.72, 0.012, 188)},
}
try:
    from paleta_cvd import PALETAS_CVD
    PALETAS.update(PALETAS_CVD)
except ImportError:
    pass

def relatorio(md=False):
    linhas = []
    for nome, pal in PALETAS.items():
        linhas.append(f'\n### {nome}\n' if md else f'\n== {nome} ==')
        head = ['Par', 'Visão normal', 'Protanopia', 'Deuteranopia', 'Tritanopia']
        rows = []
        for (n1, c1), (n2, c2) in itertools.combinations(pal.items(), 2):
            base = oklch_to_srgb(*c1), oklch_to_srgb(*c2)
            vals = []
            for k in ['normal', 'protanopia', 'deuteranopia', 'tritanopia']:
                vals.append(de2000(lin_to_lab(simulate(base[0], k)), lin_to_lab(simulate(base[1], k))))
            rows.append((f'{n1} × {n2}', vals))
        if md:
            linhas.append('| ' + ' | '.join(head) + ' |'); linhas.append('|' + '---|' * len(head))
            for n, v in rows: linhas.append(f'| {n} | ' + ' | '.join(f'{x:.1f}' + (' ⚠️' if x < 10 else '') for x in v) + ' |')
        else:
            for n, v in rows: linhas.append(f'{n:40s} ' + ' '.join(f'{x:6.1f}' + ('!' if x < 10 else ' ') for x in v))
        mn = min(min(v) for _, v in rows)
        linhas.append(f'\nMenor ΔE00 da paleta: {mn:.1f}' + (' (pares com ⚠️ são fáceis de confundir)' if md else ''))
    return '\n'.join(linhas)

if __name__ == '__main__':
    print(relatorio('--md' in sys.argv))
