import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import EnderecoCepFields from '@/components/endereco-cep-fields';
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
import { maskCpf, maskCnpj, maskPhone, validateCpf, validateCnpj, validatePhone, validateName, buildEnderecoCompleto, parseEnderecoCompleto, type EnderecoFields } from '@/lib/validators';

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
    const [endereco, setEndereco] = useState<EnderecoFields>(
        () => parseEnderecoCompleto(auth.user.instituicao?.endereco_completo || '')
    );
    const [enderecoCompleto, setEnderecoCompleto] = useState(
        auth.user.instituicao?.endereco_completo || ''
    );

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    function setFieldError(field: string, msg: string) {
        setClientErrors((prev) => ({ ...prev, [field]: msg }));
    }
    function clearFieldError(field: string) {
        setClientErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }

    function handleEnderecoChange(fields: EnderecoFields) {
        setEndereco(fields);
        setEnderecoCompleto(buildEnderecoCompleto(fields));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

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
                            if (Object.keys(errors).length > 0) console.log('Erros:', errors);
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
                                        disabled={tipo === 'admin'}
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />

                                    { tipo == 'instituicao' && (
                                        <>
                                            <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                                            <Input
                                                name="nome_fantasia"
                                                defaultValue={auth.user.instituicao?.nome_fantasia}
                                                placeholder="Nome Fantasia"
                                                required
                                                minLength={2}
                                                onBlur={(e) => {
                                                    const err = validateName(e.target.value, 'Nome fantasia');
                                                    err ? setFieldError('nome_fantasia', err) : clearFieldError('nome_fantasia');
                                                }}
                                                onChange={() => clearFieldError('nome_fantasia')}
                                            />
                                            <InputError message={clientErrors.nome_fantasia || errors.nome_fantasia} />

                                            <Label htmlFor="razao_social">Razão social</Label>
                                            <Input
                                                name="razao_social"
                                                defaultValue={auth.user.instituicao?.razao_social}
                                                placeholder="Razão social"
                                                required
                                                minLength={2}
                                                onBlur={(e) => {
                                                    const err = validateName(e.target.value, 'Razão social');
                                                    err ? setFieldError('razao_social', err) : clearFieldError('razao_social');
                                                }}
                                                onChange={() => clearFieldError('razao_social')}
                                            />
                                            <InputError message={clientErrors.razao_social || errors.razao_social} />

                                            <Label htmlFor="cnpj">CNPJ</Label>
                                            <Input
                                                name="cnpj"
                                                defaultValue={auth.user.instituicao?.cnpj}
                                                placeholder="00.000.000/0000-00"
                                                maxLength={18}
                                                required
                                                onChange={(e) => { e.target.value = maskCnpj(e.target.value); clearFieldError('cnpj'); }}
                                                onBlur={(e) => {
                                                    if (e.target.value && !validateCnpj(e.target.value)) {
                                                        setFieldError('cnpj', 'CNPJ inválido');
                                                    } else {
                                                        clearFieldError('cnpj');
                                                    }
                                                }}
                                            />
                                            <InputError message={clientErrors.cnpj || errors.cnpj} />

                                            <Label htmlFor="telefone_inst">Telefone</Label>
                                            <Input
                                                name="telefone_inst"
                                                defaultValue={auth.user.instituicao?.telefone}
                                                placeholder="(00) 00000-0000"
                                                maxLength={15}
                                                required
                                                onChange={(e) => { e.target.value = maskPhone(e.target.value); clearFieldError('telefone_inst'); }}
                                                onBlur={(e) => {
                                                    const err = validatePhone(e.target.value);
                                                    err ? setFieldError('telefone_inst', err) : clearFieldError('telefone_inst');
                                                }}
                                            />
                                            <InputError message={clientErrors.telefone_inst || errors.telefone_inst} />
                                            <input type="hidden" name="endereco_completo" value={enderecoCompleto} />
                                            <EnderecoCepFields
                                                value={endereco}
                                                onChange={handleEnderecoChange}
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
                                                required
                                                minLength={2}
                                                title="Nome deve ter pelo menos 2 caracteres"
                                                onBlur={(e) => {
                                                    const err = validateName(e.target.value, 'Nome');
                                                    err ? setFieldError('nome_completo', err) : clearFieldError('nome_completo');
                                                }}
                                                onChange={() => clearFieldError('nome_completo')}
                                            />
                                            <InputError message={clientErrors.nome_completo || errors.nome_completo} />

                                            <Label htmlFor='cpf'>CPF</Label>
                                            <Input
                                                name='cpf'
                                                defaultValue={auth.user.doador?.cpf}
                                                placeholder='000.000.000-00'
                                                maxLength={14}
                                                required
                                                onChange={(e) => { e.target.value = maskCpf(e.target.value); clearFieldError('cpf'); }}
                                                onBlur={(e) => {
                                                    if (e.target.value && !validateCpf(e.target.value)) {
                                                        setFieldError('cpf', 'CPF inválido');
                                                    } else {
                                                        clearFieldError('cpf');
                                                    }
                                                }}
                                            />
                                            <InputError message={clientErrors.cpf || errors.cpf} />

                                            <Label htmlFor='telefone'>Telefone</Label>
                                            <Input
                                                name='telefone'
                                                defaultValue={auth.user.doador?.telefone}
                                                placeholder='(00) 00000-0000'
                                                maxLength={15}
                                                required
                                                onChange={(e) => { e.target.value = maskPhone(e.target.value); clearFieldError('telefone'); }}
                                                onBlur={(e) => {
                                                    const err = validatePhone(e.target.value);
                                                    err ? setFieldError('telefone', err) : clearFieldError('telefone');
                                                }}
                                            />
                                            <InputError message={clientErrors.telefone || errors.telefone} />

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
                                        Salvar
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Salvo
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
