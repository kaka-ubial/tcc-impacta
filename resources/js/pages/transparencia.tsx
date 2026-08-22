import { Head, Link, router, usePage } from '@inertiajs/react';
import { Calendar, Package, Search, X } from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { login, redirect, register, transparencia } from '@/routes';

interface ItemPublico {
    categoria: string | null;
    descricao: string | null;
    quantidade: number;
}

interface DoacaoPublica {
    id: number;
    data_entrega: string | null;
    instituicao: string | null;
    doador: string | null;
    itens: ItemPublico[];
}

interface LinkPaginacao {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    doacoes: {
        data: DoacaoPublica[];
        links: LinkPaginacao[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filtros: { instituicao?: number; de?: string; ate?: string };
    instituicoes: { usuario_id: number; nome_fantasia: string }[];
    total: number;
}

const TODAS = 'todas';

function formatarData(data: string | null) {
    if (!data) {
        return '—';
    }

    const [ano, mes, dia] = data.split('-');

    return `${dia}/${mes}/${ano}`;
}

export default function Transparencia({
    doacoes,
    filtros,
    instituicoes,
    total,
}: Props) {
    const { auth } = usePage<{ auth: { user: unknown } }>().props;

    const [instituicao, setInstituicao] = useState(
        filtros.instituicao ? String(filtros.instituicao) : TODAS,
    );
    const [de, setDe] = useState(filtros.de ?? '');
    const [ate, setAte] = useState(filtros.ate ?? '');

    const temFiltro = instituicao !== TODAS || de !== '' || ate !== '';

    const aplicar = () => {
        router.get(
            transparencia().url,
            {
                ...(instituicao !== TODAS ? { instituicao } : {}),
                ...(de ? { de } : {}),
                ...(ate ? { ate } : {}),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const limpar = () => {
        setInstituicao(TODAS);
        setDe('');
        setAte('');
        router.get(
            transparencia().url,
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Portal de Transparência — Impacta">
                <meta
                    name="description"
                    content="Registro público das doações entregues por meio da plataforma Impacta."
                />
            </Head>

            <div className="min-h-screen bg-warm-neutral text-foreground">
                <header className="sticky top-0 z-40 border-b border-border bg-warm-neutral/90 backdrop-blur-sm">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <Link
                            href="/"
                            className="flex items-center gap-2 font-semibold"
                        >
                            <div className="flex aspect-square size-10 items-center justify-center">
                                <AppLogoIcon />
                            </div>
                            <span>Impacta</span>
                        </Link>
                        <nav className="flex items-center gap-2">
                            {auth?.user ? (
                                <Button asChild size="sm">
                                    <Link href={redirect()}>
                                        Ir para o painel
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={login()}>Entrar</Link>
                                    </Button>
                                    <Button asChild size="sm">
                                        <Link href={register()}>Cadastrar</Link>
                                    </Button>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            Portal de Transparência
                        </h1>
                        <p className="mt-3 text-muted-foreground">
                            Registro público de todas as doações já entregues às
                            instituições por meio da Impacta. Os nomes das
                            pessoas doadoras só aparecem quando elas autorizam —
                            as demais constam como anônimas.
                        </p>
                        <p className="mt-4 text-sm font-medium">
                            {total.toLocaleString('pt-BR')}{' '}
                            {total === 1
                                ? 'doação entregue'
                                : 'doações entregues'}{' '}
                            até hoje
                        </p>
                    </div>

                    <Card className="mt-8">
                        <CardContent className="grid gap-4 pt-6 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
                            <div className="grid gap-2">
                                <Label htmlFor="instituicao">Instituição</Label>
                                <Select
                                    value={instituicao}
                                    onValueChange={setInstituicao}
                                >
                                    <SelectTrigger id="instituicao">
                                        <SelectValue placeholder="Todas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={TODAS}>
                                            Todas as instituições
                                        </SelectItem>
                                        {instituicoes.map((inst) => (
                                            <SelectItem
                                                key={inst.usuario_id}
                                                value={String(inst.usuario_id)}
                                            >
                                                {inst.nome_fantasia}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="de">De</Label>
                                <Input
                                    id="de"
                                    type="date"
                                    value={de}
                                    onChange={(e) => setDe(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ate">Até</Label>
                                <Input
                                    id="ate"
                                    type="date"
                                    value={ate}
                                    onChange={(e) => setAte(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={aplicar}>
                                    <Search className="size-4" />
                                    Filtrar
                                </Button>
                                {temFiltro && (
                                    <Button
                                        variant="ghost"
                                        onClick={limpar}
                                        aria-label="Limpar filtros"
                                    >
                                        <X className="size-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-8 space-y-4">
                        {doacoes.data.length === 0 && (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <Package className="mx-auto mb-3 size-8 opacity-40" />
                                    Nenhuma doação encontrada para os filtros
                                    escolhidos.
                                </CardContent>
                            </Card>
                        )}

                        {doacoes.data.map((doacao) => (
                            <Card key={doacao.id}>
                                <CardContent className="pt-6">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold">
                                                {doacao.instituicao ??
                                                    'Instituição removida'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {doacao.doador
                                                    ? `Doado por ${doacao.doador}`
                                                    : 'Doador anônimo'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Calendar className="size-4" />
                                            {formatarData(doacao.data_entrega)}
                                        </div>
                                    </div>

                                    <ul className="mt-4 flex flex-wrap gap-2">
                                        {doacao.itens.map((item, i) => (
                                            <li key={i}>
                                                <Badge
                                                    variant="secondary"
                                                    className="font-normal"
                                                >
                                                    {item.quantidade}×{' '}
                                                    {item.categoria ?? 'Item'}
                                                    {item.descricao
                                                        ? ` — ${item.descricao}`
                                                        : ''}
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {doacoes.last_page > 1 && (
                        <nav
                            className="mt-8 flex flex-wrap justify-center gap-1"
                            aria-label="Paginação"
                        >
                            {doacoes.links.map((link, i) =>
                                link.url ? (
                                    <Button
                                        key={i}
                                        asChild
                                        size="sm"
                                        variant={
                                            link.active ? 'default' : 'ghost'
                                        }
                                    >
                                        <Link href={link.url} preserveScroll>
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        key={i}
                                        size="sm"
                                        variant="ghost"
                                        disabled
                                    >
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    </Button>
                                ),
                            )}
                        </nav>
                    )}
                </main>
            </div>
        </>
    );
}
