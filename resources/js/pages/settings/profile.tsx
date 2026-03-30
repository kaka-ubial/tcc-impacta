import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage, useForm } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
        title: 'Profile settings',
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
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Profile information"
                        description="Update your name and email address"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => {
                            if (Object.keys(errors).length > 0) console.log('Erros:', errors);
                        return (
                            <>
                                <div className="grid gap-2">
                                    <Input
                                        type="hidden"
                                        name="tipo_usuario"
                                        defaultValue={auth.user.tipo_usuario}
                                    />
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />

                                    { tipo == 'instituicao' && (
                                        <>
                                            <Label htmlFor="email">Nome Fantasia</Label>
                                            <Input
                                                name="nome_fantasia"
                                                defaultValue={auth.user.instituicao?.nome_fantasia}
                                                placeholder="Nome Fantasia"
                                            />
                                            <Label htmlFor="email">Razão social</Label>
                                            <Input
                                                name="razao_social"
                                                defaultValue={auth.user.instituicao?.razao_social}
                                                placeholder="Razão social"
                                            />
                                            <Label htmlFor="email">CNPJ</Label>
                                            <Input
                                                name="cnpj"
                                                defaultValue={auth.user.instituicao?.cnpj}
                                                placeholder="CNPJ"
                                            />
                                            <Label htmlFor="email">Telefone</Label>
                                            <Input
                                                name="telefone_inst"
                                                defaultValue={auth.user.instituicao?.telefone}
                                                placeholder="Telefone"
                                            />
                                            <Label htmlFor="email">Endereço</Label>
                                            <Input
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
                                                name='nome_completo'
                                                defaultValue={auth.user.doador?.nome_completo}
                                                placeholder='Nome completo'
                                            />
                                            <Label htmlFor='cpf'>CPF</Label>
                                            <Input
                                                name='cpf'
                                                defaultValue={auth.user.doador?.cpf}
                                                placeholder='CPF'
                                            />
                                            <Label htmlFor='telefone'>Telefone</Label>
                                            <Input
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
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
