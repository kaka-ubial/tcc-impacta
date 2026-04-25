import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import AlertSuccess from '@/components/ui/alert-success';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Perfil',
        href: edit(),
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const tipo = auth.user.tipo_usuario;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configurações do perfil" />

            <h1 className="sr-only">Configurações do perfil</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Informações do perfil"
                        description="Atualize suas informações"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => {
                            if (Object.keys(errors).length > 0) {
console.log('Erros:', errors);
}

                        return (
                            <>
                                <div className="grid gap-2">
                                    <Input
                                        type="hidden"
                                        name="tipo_usuario"
                                        defaultValue={auth.user.tipo_usuario}
                                    />
                                    <Label htmlFor="email">Endereço de email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Endereço de email"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />

                                    { tipo == 'instituicao' && (
                                        <>
                                            <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                                            <Input
                                                id="nome_fantasia"
                                                name="nome_fantasia"
                                                defaultValue={auth.user.instituicao?.nome_fantasia}
                                                placeholder="Nome Fantasia"
                                            />
                                            <Label htmlFor="razao_social">Razão social</Label>
                                            <Input
                                                id="razao_social"
                                                name="razao_social"
                                                defaultValue={auth.user.instituicao?.razao_social}
                                                placeholder="Razão social"
                                            />
                                            <Label htmlFor="cnpj">CNPJ</Label>
                                            <Input
                                                id="cnpj"
                                                name="cnpj"
                                                defaultValue={auth.user.instituicao?.cnpj}
                                                placeholder="CNPJ"
                                            />
                                            <Label htmlFor="telefone_inst">Telefone</Label>
                                            <Input
                                                id="telefone_inst"
                                                name="telefone_inst"
                                                defaultValue={auth.user.instituicao?.telefone}
                                                placeholder="Telefone"
                                            />
                                            <Label htmlFor="endereco_completo">Endereço</Label>
                                            <Input
                                                id="endereco_completo"
                                                name="endereco_completo"
                                                defaultValue={auth.user.instituicao?.endereco_completo}
                                                placeholder="Endereço"
                                            />
                                        </>
                                    )}

                                    { tipo === 'doador' && (
                                        <>
                                            <Label htmlFor='nome_completo'>Nome Completo</Label>
                                            <Input
                                                id='nome_completo'
                                                name='nome_completo'
                                                defaultValue={auth.user.doador?.nome_completo}
                                                placeholder='Nome completo'
                                            />
                                            <Label htmlFor='cpf'>CPF</Label>
                                            <Input
                                                id='cpf'
                                                name='cpf'
                                                defaultValue={auth.user.doador?.cpf}
                                                placeholder='CPF'
                                            />
                                            <Label htmlFor='telefone'>Telefone</Label>
                                            <Input
                                                id='telefone'
                                                name='telefone'
                                                defaultValue={auth.user.doador?.telefone}
                                                placeholder='Telefone'
                                            />
                                        </>
                                    )}
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Seu endereço de email não foi verificado.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-muted-foreground/40 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current!"
                                                >
                                                    Clique aqui para reenviar o email de verificação.
                                                </Link>
                                            </p>

                                            {status === 'verification-link-sent' && (
                                                <div className="mt-2">
                                                    <AlertSuccess message="Um novo link de verificação foi enviado para seu email." />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Salvar
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-muted-foreground">
                                            Salvo
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )
}}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
