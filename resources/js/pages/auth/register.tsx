import { Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

type TipoUsuario = 'doador' | 'instituicao' | null;

const stepLabels = ['Acesso', 'Tipo de conta', 'Seus dados'];

export default function Register() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [tipo, setTipo] = useState<TipoUsuario>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        password_confirmation: '',
        tipo_usuario: '' as 'doador' | 'instituicao' | '',
        nome_completo: '',
        cpf: '',
        telefone: '',
        nome_fantasia: '',
        razao_social: '',
        cnpj: '',
        telefone_inst: '',
        endereco_completo: '',
    });

    function handleTipo(t: 'doador' | 'instituicao') {
        setTipo(t);
        setData('tipo_usuario', t);
    }

    function nextStep() {
        setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s));
    }

    function prevStep() {
        setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(store.url(), {
            onSuccess: () => reset('password', 'password_confirmation'),
        });
    }

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <Head title="Cadastro" />

            {/* Coluna esquerda — formulário */}
            <div className="flex flex-col gap-4 p-6 md:p-10">
                {/* Logo */}
                <div className="flex justify-center gap-2 md:justify-start">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Heart className="size-3.5" />
                        </div>
                        Impacta
                    </a>
                </div>

                {/* Formulário centralizado */}
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <div className="flex flex-col gap-6">

                            {/* Cabeçalho */}
                            <div className="flex flex-col gap-1 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Criar conta
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {stepLabels[step - 1]}
                                </p>
                            </div>

                            {/* Indicador de steps */}
                            <div className="flex items-center gap-2">
                                {stepLabels.map((label, i) => {
                                    const n = i + 1;
                                    const done = step > n;
                                    const active = step === n;
                                    return (
                                        <div key={n} className="flex flex-1 flex-col items-center gap-1">
                                            <div
                                                className={cn(
                                                    'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition-all duration-200',
                                                    done && 'border-primary bg-primary text-primary-foreground',
                                                    active && 'border-primary text-primary',
                                                    !active && !done && 'border-muted-foreground/30 text-muted-foreground'
                                                )}
                                            >
                                                {done ? '✓' : n}
                                            </div>
                                            <span
                                                className={cn(
                                                    'text-xs transition-colors',
                                                    active ? 'font-medium text-primary' : 'text-muted-foreground'
                                                )}
                                            >
                                                {label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Conteúdo dos steps */}
                            <form onSubmit={submit} className="flex flex-col gap-4">

                                {/* Step 1 — Credenciais */}
                                {step === 1 && (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="email">E-mail</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                autoFocus
                                                autoComplete="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="seu@email.com"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="password">Senha</Label>
                                            <PasswordInput
                                                id="password"
                                                required
                                                autoComplete="new-password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="Senha"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="password_confirmation">Confirmar senha</Label>
                                            <PasswordInput
                                                id="password_confirmation"
                                                required
                                                autoComplete="new-password"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                placeholder="Confirme sua senha"
                                            />
                                            <InputError message={errors.password_confirmation} />
                                        </div>

                                        <Button
                                            type="button"
                                            className="w-full"
                                            onClick={nextStep}
                                            disabled={!data.email || !data.password || !data.password_confirmation}
                                        >
                                            Continuar
                                        </Button>
                                    </div>
                                )}

                                {/* Step 2 — Tipo de conta */}
                                {step === 2 && (
                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <label
                                                htmlFor="tipo_doador"
                                                className={cn(
                                                    'flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all duration-150',
                                                    tipo === 'doador'
                                                        ? 'border-primary bg-primary/5'
                                                        : 'hover:border-primary/40'
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    id="tipo_doador"
                                                    name="tipo_usuario"
                                                    value="doador"
                                                    className="sr-only"
                                                    onChange={() => handleTipo('doador')}
                                                    checked={tipo === 'doador'}
                                                />
                                                <span className="text-2xl">🤝</span>
                                                <span className="text-sm font-medium">Doador</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Quero realizar doações
                                                </span>
                                            </label>

                                            <label
                                                htmlFor="tipo_instituicao"
                                                className={cn(
                                                    'flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all duration-150',
                                                    tipo === 'instituicao'
                                                        ? 'border-primary bg-primary/5'
                                                        : 'hover:border-primary/40'
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    id="tipo_instituicao"
                                                    name="tipo_usuario"
                                                    value="instituicao"
                                                    className="sr-only"
                                                    onChange={() => handleTipo('instituicao')}
                                                    checked={tipo === 'instituicao'}
                                                />
                                                <span className="text-2xl">🏛️</span>
                                                <span className="text-sm font-medium">Instituição</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Represento uma instituição
                                                </span>
                                            </label>
                                        </div>
                                        <InputError message={errors.tipo_usuario} />

                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={prevStep}
                                            >
                                                Voltar
                                            </Button>
                                            <Button
                                                type="button"
                                                className="flex-1"
                                                onClick={nextStep}
                                                disabled={!tipo}
                                            >
                                                Continuar
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 — Dados do Doador */}
                                {step === 3 && tipo === 'doador' && (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="nome_completo">Nome completo</Label>
                                            <Input
                                                id="nome_completo"
                                                type="text"
                                                autoFocus
                                                autoComplete="name"
                                                value={data.nome_completo}
                                                onChange={(e) => setData('nome_completo', e.target.value)}
                                                placeholder="Seu nome completo"
                                            />
                                            <InputError message={errors.nome_completo} />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="cpf">CPF</Label>
                                            <Input
                                                id="cpf"
                                                type="text"
                                                value={data.cpf}
                                                onChange={(e) => setData('cpf', e.target.value)}
                                                placeholder="000.000.000-00"
                                            />
                                            <InputError message={errors.cpf} />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="telefone">Telefone</Label>
                                            <Input
                                                id="telefone"
                                                type="tel"
                                                value={data.telefone}
                                                onChange={(e) => setData('telefone', e.target.value)}
                                                placeholder="(00) 00000-0000"
                                            />
                                            <InputError message={errors.telefone} />
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={prevStep}
                                            >
                                                Voltar
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="flex-1"
                                                disabled={processing}
                                            >
                                                {processing && <Spinner />}
                                                Criar conta
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 — Dados da Instituição */}
                                {step === 3 && tipo === 'instituicao' && (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="nome_fantasia">Nome fantasia</Label>
                                            <Input
                                                id="nome_fantasia"
                                                type="text"
                                                autoFocus
                                                value={data.nome_fantasia}
                                                onChange={(e) => setData('nome_fantasia', e.target.value)}
                                                placeholder="Nome da instituição"
                                            />
                                            <InputError message={errors.nome_fantasia} />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="razao_social">Razão social</Label>
                                            <Input
                                                id="razao_social"
                                                type="text"
                                                value={data.razao_social}
                                                onChange={(e) => setData('razao_social', e.target.value)}
                                                placeholder="Razão social"
                                            />
                                            <InputError message={errors.razao_social} />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="cnpj">CNPJ</Label>
                                            <Input
                                                id="cnpj"
                                                type="text"
                                                value={data.cnpj}
                                                onChange={(e) => setData('cnpj', e.target.value)}
                                                placeholder="00.000.000/0000-00"
                                            />
                                            <InputError message={errors.cnpj} />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="telefone_inst">Telefone</Label>
                                            <Input
                                                id="telefone_inst"
                                                type="tel"
                                                value={data.telefone_inst}
                                                onChange={(e) => setData('telefone_inst', e.target.value)}
                                                placeholder="(00) 00000-0000"
                                            />
                                            <InputError message={errors.telefone} />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="endereco_completo">Endereço completo</Label>
                                            <Input
                                                id="endereco_completo"
                                                type="text"
                                                value={data.endereco_completo}
                                                onChange={(e) => setData('endereco_completo', e.target.value)}
                                                placeholder="Rua, número, bairro, cidade"
                                            />
                                            <InputError message={errors.endereco_completo} />
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={prevStep}
                                            >
                                                Voltar
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="flex-1"
                                                disabled={processing}
                                            >
                                                {processing && <Spinner />}
                                                Criar conta
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </form>

                            {/* Link para login */}
                            <div className="text-center text-sm text-muted-foreground">
                                Já tem uma conta?{' '}
                                <TextLink href={login.url()}>
                                    Entrar
                                </TextLink>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Coluna direita — imagem decorativa */}
            <div className="relative hidden bg-muted lg:block">
                <img
                    src="/placeholder.svg"
                    alt="Impacta"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
                {/* Overlay com mensagem */}
                <div className="absolute inset-0 flex flex-col justify-end p-10">
                    <div className="space-y-2 rounded-xl bg-background/80 p-6 backdrop-blur-sm">
                        <p className="text-lg font-semibold leading-snug">
                            Conectando quem quer ajudar<br />com quem precisa.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Faça parte da rede Impacta e transforme intenções em impacto real.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
