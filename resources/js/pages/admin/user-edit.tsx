import { Head, useForm } from '@inertiajs/react';
import { ShieldOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { SuspendUserModal } from '@/components/suspend-user-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';
import type {
    AdminUser,
    DoadorPerfil,
    InstituicaoPerfil,
} from '@/types/admin-user';

interface Props {
    usuario: AdminUser;
    perfil: DoadorPerfil | InstituicaoPerfil | null;
}

const STATUS_LABELS: Record<string, string> = {
    ativo: 'Ativo',
    suspenso: 'Suspenso',
};

function DoadorForm({
    usuario,
    perfil,
}: {
    usuario: AdminUser;
    perfil: DoadorPerfil;
}) {
    const { data, setData, put, processing, errors } = useForm({
        nome_completo: perfil.nome_completo,
        cpf: perfil.cpf,
        telefone: perfil.telefone,
        endereco_completo: perfil.endereco_completo ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(admin.doadores.update(usuario.id).url);
    };

    return (
        <form onSubmit={submit} className="max-w-lg space-y-4">
            <div className="space-y-2">
                <Label htmlFor="nome_completo">Nome completo</Label>
                <Input
                    id="nome_completo"
                    value={data.nome_completo}
                    onChange={(e) => setData('nome_completo', e.target.value)}
                />
                <InputError message={errors.nome_completo} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                    id="cpf"
                    value={data.cpf}
                    onChange={(e) => setData('cpf', e.target.value)}
                />
                <InputError message={errors.cpf} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                    id="telefone"
                    value={data.telefone}
                    onChange={(e) => setData('telefone', e.target.value)}
                    placeholder="(99) 99999-9999"
                />
                <InputError message={errors.telefone} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="endereco_completo">Endereço</Label>
                <Textarea
                    id="endereco_completo"
                    value={data.endereco_completo}
                    onChange={(e) =>
                        setData('endereco_completo', e.target.value)
                    }
                    rows={2}
                />
                <InputError message={errors.endereco_completo} />
            </div>

            <Button type="submit" disabled={processing}>
                Salvar alterações
            </Button>
        </form>
    );
}

function InstituicaoForm({
    usuario,
    perfil,
}: {
    usuario: AdminUser;
    perfil: InstituicaoPerfil;
}) {
    const { data, setData, put, processing, errors } = useForm({
        nome_fantasia: perfil.nome_fantasia,
        razao_social: perfil.razao_social,
        cnpj: perfil.cnpj,
        telefone: perfil.telefone,
        endereco_completo: perfil.endereco_completo,
        descricao: perfil.descricao ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(admin.instituicoes.update(usuario.id).url);
    };

    return (
        <form onSubmit={submit} className="max-w-lg space-y-4">
            <div className="space-y-2">
                <Label htmlFor="nome_fantasia">Nome fantasia</Label>
                <Input
                    id="nome_fantasia"
                    value={data.nome_fantasia}
                    onChange={(e) => setData('nome_fantasia', e.target.value)}
                />
                <InputError message={errors.nome_fantasia} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="razao_social">Razão social</Label>
                <Input
                    id="razao_social"
                    value={data.razao_social}
                    onChange={(e) => setData('razao_social', e.target.value)}
                />
                <InputError message={errors.razao_social} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                    id="cnpj"
                    value={data.cnpj}
                    onChange={(e) => setData('cnpj', e.target.value)}
                />
                <InputError message={errors.cnpj} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                    id="telefone"
                    value={data.telefone}
                    onChange={(e) => setData('telefone', e.target.value)}
                    placeholder="(99) 99999-9999"
                />
                <InputError message={errors.telefone} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="endereco_completo">Endereço</Label>
                <Textarea
                    id="endereco_completo"
                    value={data.endereco_completo}
                    onChange={(e) =>
                        setData('endereco_completo', e.target.value)
                    }
                    rows={2}
                />
                <InputError message={errors.endereco_completo} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                    id="descricao"
                    value={data.descricao}
                    onChange={(e) => setData('descricao', e.target.value)}
                    rows={3}
                />
                <InputError message={errors.descricao} />
            </div>

            <Button type="submit" disabled={processing}>
                Salvar alterações
            </Button>
        </form>
    );
}

export default function UserEdit({ usuario, perfil }: Props) {
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const isSuspended = usuario.status === 'suspenso';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Usuários', href: admin.users.index() },
        {
            title: usuario.nome ?? usuario.email,
            href: admin.users.show(usuario.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={usuario.nome ?? usuario.email} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={usuario.nome ?? usuario.email}
                        description={`${usuario.email} · ${usuario.tipo_usuario}`}
                    />

                    <div className="flex items-center gap-3">
                        <Badge variant="outline">
                            {STATUS_LABELS[usuario.status] ?? usuario.status}
                        </Badge>

                        {usuario.tipo_usuario !== 'admin' && (
                            <Button
                                variant={
                                    isSuspended ? 'default' : 'destructive'
                                }
                                className={
                                    isSuspended
                                        ? 'bg-brand-green text-success-foreground hover:opacity-90'
                                        : ''
                                }
                                onClick={() => setShowSuspendModal(true)}
                            >
                                {isSuspended ? (
                                    <>
                                        <ShieldCheck className="size-4" />{' '}
                                        Reativar
                                    </>
                                ) : (
                                    <>
                                        <ShieldOff className="size-4" />{' '}
                                        Suspender
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {isSuspended && usuario.motivo_suspensao && (
                    <div className="max-w-lg rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        <strong>Motivo da suspensão:</strong>{' '}
                        {usuario.motivo_suspensao}
                    </div>
                )}

                {perfil && usuario.tipo_usuario === 'doador' && (
                    <DoadorForm
                        usuario={usuario}
                        perfil={perfil as DoadorPerfil}
                    />
                )}

                {perfil && usuario.tipo_usuario === 'instituicao' && (
                    <InstituicaoForm
                        usuario={usuario}
                        perfil={perfil as InstituicaoPerfil}
                    />
                )}
            </div>

            {showSuspendModal && (
                <SuspendUserModal
                    user={usuario}
                    isOpen={true}
                    onClose={() => setShowSuspendModal(false)}
                />
            )}
        </AppLayout>
    );
}
