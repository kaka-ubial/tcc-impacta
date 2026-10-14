import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Heart } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DIAS } from '@/lib/horarios';
import { home } from '@/routes';
import { waitingValidation } from '@/routes';
import type { HorarioDisponivel } from '@/types';

type Ficha = {
    email: string;
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    telefone: string | null;
    endereco_completo: string | null;
    descricao: string | null;
    causas: string[];
};

type Props = {
    ficha: Ficha;
    horarios: HorarioDisponivel[];
};

function Campo({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium break-words sm:col-span-2">
                {children || (
                    <span className="font-normal text-muted-foreground">
                        Não informado
                    </span>
                )}
            </dd>
        </div>
    );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {titulo}
            </h2>
            {children}
        </section>
    );
}

export default function RegistrationSummary({ ficha, horarios }: Props) {
    return (
        <div className="flex min-h-screen flex-col bg-muted/50">
            <Head title="Ficha de cadastro" />

            <header className="flex h-14 shrink-0 items-center px-6 lg:px-10">
                <Link
                    href={home()}
                    className="flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-75"
                >
                    <div className="flex size-7 items-center justify-center rounded-md bg-brand text-primary-foreground">
                        <Heart className="size-4" aria-hidden="true" />
                    </div>
                    Impacta
                </Link>
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-2 pb-12 sm:px-6">
                <div>
                    <Button asChild variant="ghost" size="sm">
                        <Link href={waitingValidation()}>
                            <ArrowLeft aria-hidden="true" />
                            Voltar
                        </Link>
                    </Button>
                </div>

                <article className="flex flex-col gap-8 rounded-3xl border bg-background p-6 shadow-sm sm:p-8">
                    <header className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Ficha de cadastro
                            </p>
                            <h1 className="text-2xl font-semibold">
                                {ficha.nome_fantasia}
                            </h1>
                        </div>
                        <Badge variant="secondary">Em análise</Badge>
                    </header>

                    <Secao titulo="Dados da instituição">
                        <dl className="flex flex-col gap-3">
                            <Campo label="Nome fantasia">
                                {ficha.nome_fantasia}
                            </Campo>
                            <Campo label="Razão social">
                                {ficha.razao_social}
                            </Campo>
                            <Campo label="CNPJ">{ficha.cnpj}</Campo>
                            <Campo label="Descrição">{ficha.descricao}</Campo>
                        </dl>
                    </Secao>

                    <Secao titulo="Contato e endereço">
                        <dl className="flex flex-col gap-3">
                            <Campo label="E-mail">{ficha.email}</Campo>
                            <Campo label="Telefone">{ficha.telefone}</Campo>
                            <Campo label="Endereço">
                                {ficha.endereco_completo}
                            </Campo>
                        </dl>
                    </Secao>

                    <Secao titulo="Causas apoiadas">
                        {ficha.causas.length > 0 ? (
                            <ul className="flex flex-wrap gap-2">
                                {ficha.causas.map((causa) => (
                                    <li key={causa}>
                                        <Badge variant="outline">{causa}</Badge>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Nenhuma causa informada.
                            </p>
                        )}
                    </Secao>

                    <Secao titulo="Horários">
                        {horarios.length > 0 ? (
                            <ul className="flex flex-col gap-2">
                                {horarios.map((h) => (
                                    <li
                                        key={h.id}
                                        className="flex flex-wrap items-center gap-2 text-sm"
                                    >
                                        <Badge variant="outline">
                                            {DIAS[h.dia_semana]}
                                        </Badge>
                                        <span>
                                            {h.hora_inicio.slice(0, 5)} –{' '}
                                            {h.hora_fim.slice(0, 5)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {h.tipo === 'coleta'
                                                ? 'Coleta'
                                                : 'Entrega'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Nenhum horário definido ainda.
                            </p>
                        )}
                    </Secao>
                </article>

                <p className="text-center text-xs text-muted-foreground">
                    Os dados acima estão em análise pela nossa equipe.
                </p>
            </main>
        </div>
    );
}
