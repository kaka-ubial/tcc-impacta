import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DeleteUser from '@/components/delete-user';
import { DoadorFotoUploader } from '@/components/doador-foto-uploader';
import EnderecoCepFields from '@/components/endereco-cep-fields';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import AlertSuccess from '@/components/ui/alert-success';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';
import { maskCpf, maskCnpj, maskPhone, runValidation, rules, buildEnderecoCompleto, parseEnderecoCompleto  } from '@/lib/validators';
import type {EnderecoFields} from '@/lib/validators';
import type { BreadcrumbItem } from '@/types';
import type { Causa } from '@/types/auth';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Perfil',
        href: edit(),
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
    causas,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    causas: Causa[];
}) {
    const { auth } = usePage().props;
    const tipo = auth.user.tipo_usuario;

    const enderecoSource = tipo === 'doador'
        ? auth.user.doador?.endereco_completo || ''
        : auth.user.instituicao?.endereco_completo || '';

    const [endereco, setEndereco] = useState<EnderecoFields>(
        () => parseEnderecoCompleto(enderecoSource)
    );
    const [enderecoCompleto, setEnderecoCompleto] = useState(enderecoSource);

    const [latitude, setLatitude] = useState<number | null>(auth.user.doador?.latitude ?? null);
    const [longitude, setLongitude] = useState<number | null>(auth.user.doador?.longitude ?? null);

    const [selectedCausas, setSelectedCausas] = useState<number[]>(
        () => auth.user.causas?.map((c) => c.id) ?? []
    );

    function toggleCausa(id: number) {
        setSelectedCausas((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    const [geocodingQuery, setGeocodingQuery] = useState(() => {
        const e = endereco;

        return [e.logradouro, e.numero, e.cidade, e.uf, 'Brasil'].filter(Boolean).join(', ');
    });
    const [addressTouched, setAddressTouched] = useState(() => !!enderecoSource);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    function validateField(field: string, value: string, fieldRules: ((v: string) => string | null)[]) {
        const errs = runValidation({ [field]: value }, { [field]: fieldRules });
        setClientErrors((prev) => {
            const next = { ...prev };

            if (errs[field]) {
next[field] = errs[field];
} else {
delete next[field];
}

            return next;
        });
    }

    function clearField(field: string) {
        setClientErrors((prev) => {
            const rest = { ...prev };

            delete rest[field];

            return rest;
        });
    }

    function handleEnderecoChange(fields: EnderecoFields) {
        setEndereco(fields);
        setEnderecoCompleto(buildEnderecoCompleto(fields));
        setLatitude(null);
        setLongitude(null);
        setAddressTouched(true);
        setGeocodingQuery(
            [fields.logradouro, fields.numero, fields.cidade, fields.uf, 'Brasil'].filter(Boolean).join(', ')
        );
    }

    const enderecoErrors = (() => {
        if (!addressTouched) {
return {};
}

        const hasAnyField = Object.values(endereco).some((v) => !!v);

        if (!hasAnyField) {
return {};
}

        const errs: Partial<Record<keyof EnderecoFields, string>> = {};

        if (!endereco.logradouro) {
errs.logradouro = 'Campo obrigatório';
}

        if (!endereco.cidade) {
errs.cidade = 'Campo obrigatório';
}

        if (!endereco.uf) {
errs.uf = 'Campo obrigatório';
}

        return errs;
    })();
    const hasEnderecoErrors = Object.keys(enderecoErrors).length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configurações do perfil" />

            <h1 className="sr-only">Configurações do perfil</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    {tipo === 'doador' && (
                        <div className="space-y-3">
                            <Heading
                                variant="small"
                                title="Foto de perfil"
                                description="Sua foto aparecerá para as instituições ao receberem suas doações."
                            />
                            <DoadorFotoUploader
                                nome={auth.user.doador?.nome_completo ?? auth.user.email}
                                fotoAtual={auth.user.doador?.foto_perfil ?? null}
                            />
                        </div>
                    )}

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
                                                required
                                                minLength={2}
                                                onBlur={(e) => validateField('nome_fantasia', e.target.value, [rules.name('Nome fantasia')])}
                                                onChange={() => clearField('nome_fantasia')}
                                            />
                                            <InputError message={clientErrors.nome_fantasia || errors.nome_fantasia} />

                                            <Label htmlFor="razao_social">Razão social</Label>
                                            <Input
                                                id="razao_social"
                                                name="razao_social"
                                                defaultValue={auth.user.instituicao?.razao_social}
                                                placeholder="Razão social"
                                                required
                                                minLength={2}
                                                onBlur={(e) => validateField('razao_social', e.target.value, [rules.name('Razão social')])}
                                                onChange={() => clearField('razao_social')}
                                            />
                                            <InputError message={clientErrors.razao_social || errors.razao_social} />

                                            <Label htmlFor="cnpj">CNPJ</Label>
                                            <Input
                                                id="cnpj"
                                                name="cnpj"
                                                defaultValue={auth.user.instituicao?.cnpj}
                                                placeholder="00.000.000/0000-00"
                                                maxLength={18}
                                                required
                                                onChange={(e) => {
 e.target.value = maskCnpj(e.target.value); clearField('cnpj'); 
}}
                                                onBlur={(e) => validateField('cnpj', e.target.value, [rules.cnpj()])}
                                            />
                                            <InputError message={clientErrors.cnpj || errors.cnpj} />

                                            <Label htmlFor="telefone_inst">Telefone</Label>
                                            <Input
                                                id="telefone_inst"
                                                name="telefone_inst"
                                                defaultValue={auth.user.instituicao?.telefone}
                                                placeholder="(00) 00000-0000"
                                                maxLength={15}
                                                required
                                                onChange={(e) => {
 e.target.value = maskPhone(e.target.value); clearField('telefone_inst'); 
}}
                                                onBlur={(e) => validateField('telefone_inst', e.target.value, [rules.phone()])}
                                            />
                                            <InputError message={clientErrors.telefone_inst || errors.telefone_inst} />
                                            <input type="hidden" name="endereco_completo" value={enderecoCompleto} />

                                                {/* <
                                                id="endereco_completo"
                                                name="endereco_completo"
                                                defaultValue={auth.user.instituicao?.endereco_completo}
                                                placeholder="Endereço"> */}

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
                                                id='nome_completo'
                                                name='nome_completo'
                                                defaultValue={auth.user.doador?.nome_completo}
                                                placeholder='Nome completo'
                                                required
                                                minLength={2}
                                                onBlur={(e) => validateField('nome_completo', e.target.value, [rules.name('Nome')])}
                                                onChange={() => clearField('nome_completo')}
                                            />
                                            <InputError message={clientErrors.nome_completo || errors.nome_completo} />

                                            <Label htmlFor='cpf'>CPF</Label>
                                            <Input
                                                id='cpf'
                                                name='cpf'
                                                defaultValue={auth.user.doador?.cpf}
                                                placeholder='000.000.000-00'
                                                maxLength={14}
                                                required
                                                onChange={(e) => {
 e.target.value = maskCpf(e.target.value); clearField('cpf'); 
}}
                                                onBlur={(e) => validateField('cpf', e.target.value, [rules.cpf()])}
                                            />
                                            <InputError message={clientErrors.cpf || errors.cpf} />

                                            <Label htmlFor='telefone'>Telefone</Label>
                                            <Input
                                                id='telefone'
                                                name='telefone'
                                                defaultValue={auth.user.doador?.telefone}
                                                placeholder='(00) 00000-0000'
                                                maxLength={15}
                                                required
                                                onChange={(e) => {
 e.target.value = maskPhone(e.target.value); clearField('telefone'); 
}}
                                                onBlur={(e) => validateField('telefone', e.target.value, [rules.phone()])}
                                            />
                                            <InputError message={clientErrors.telefone || errors.telefone} />

                                            <input type="hidden" name="endereco_completo" value={enderecoCompleto} />
                                            <input type="hidden" name="geocoding_query" value={geocodingQuery} />
                                            {latitude !== null && <input type="hidden" name="latitude" value={latitude} />}
                                            {longitude !== null && <input type="hidden" name="longitude" value={longitude} />}

                                            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 mt-1">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        Endereço <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        Usado para sugerir instituições próximas a você.
                                                    </p>
                                                </div>
                                                <EnderecoCepFields
                                                    value={endereco}
                                                    onChange={handleEnderecoChange}
                                                    errors={enderecoErrors}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {tipo === 'doador' && (
                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Causas apoiadas</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Usamos suas causas para recomendar instituições relevantes.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {causas.map((causa) => {
                                                const isSelected = selectedCausas.includes(causa.id);

                                                return (
                                                    <button
                                                        key={causa.id}
                                                        type="button"
                                                        onClick={() => toggleCausa(causa.id)}
                                                        className={cn(
                                                            'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-all duration-150',
                                                            isSelected
                                                                ? 'border-brand bg-brand/8 text-brand'
                                                                : 'border-border bg-card text-muted-foreground hover:border-brand/30 hover:text-foreground',
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'size-3.5 shrink-0 rounded-full border-2 transition-colors duration-150',
                                                                isSelected ? 'border-brand bg-brand' : 'border-muted-foreground/30',
                                                            )}
                                                        />
                                                        {causa.nome}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <input type="hidden" name="causas_submitted" value="1" />
                                        {selectedCausas.map((id) => (
                                            <input key={id} type="hidden" name="causas_apoiadas[]" value={id} />
                                        ))}
                                        <InputError message={errors.causas_apoiadas as string | undefined} />
                                    </div>
                                )}

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
                                        disabled={processing || hasEnderecoErrors}
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
