import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { store } from '@/routes/register';

type TipoUsuario = 'doador' | 'instituicao' | null;

const stepLabels = ['Conta', 'Perfil', 'Informações', 'Causas'];

export default function Register({causas}: { causas: any[] }) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [tipo, setTipo] = useState<TipoUsuario>(null);

    const toggleCausa = (id: number) => {
        const current = data.causas_apoiadas

        if (current.includes(id)) {
            setData('causas_apoiadas', current.filter((item => item !== id)));
        } else {
            setData('causas_apoiadas', [...current, id]);
        }
    }

    const { data, setData, post, processing, errors, reset, clearErrors    } = useForm({
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
        causas_apoiadas: [] as number[],
    });

    function handleTipo(t: 'doador' | 'instituicao') {
        setTipo(t);
        setData('tipo_usuario', t);
    }

    function handleStepOne() {
        clearErrors();
        post('/validate/register-step-one', {
            preserveScroll: true,
            onSuccess: () => {
setStep(2)
},
        });           
    }


    function nextStep() {
        setStep((s) => (s < 4 ? ((s + 1) as any) : s));
    }

    function prevStep() {
        setStep((s) => (s > 1 ? ((s - 1) as any) : s));
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
                                            onClick={handleStepOne}
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
                                                type="button"
                                                className="flex-1"
                                                onClick={nextStep}
                                                disabled={processing}
                                            >
                                                {processing && <Spinner />}
                                                Próximo
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
                                                type="button"
                                                className="flex-1"
                                                onClick={nextStep}
                                            >
                                                {processing && <Spinner />}
                                                Próximo
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4 — Causas Apoiadas */}
                                {step === 4 && (
                                    <div className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <p className="text-sm text-muted-foreground text-center">Quais causas você deseja apoiar?</p>
                                        <div className="grid grid-cols-2 gap-2 overflow-y-auto p-1 border rounded-md">
                                        {causas?.map((causa) => {
                                            const isSelected = data.causas_apoiadas.includes(causa.id);
                                            
                                            return (
                                                <button
                                                key={causa.id || `causa-${causa.nome}`}
                                                    type="button"
                                                    onClick={() => toggleCausa(causa.id)}
                                                    className={cn(
                                                        "flex items-center justify-between rounded-xl border-2 p-3 text-left transition-all duration-200",
                                                        isSelected 
                                                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                                            : "border-muted hover:border-muted-foreground/30 bg-card"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                                                            isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
                                                        )}>
                                                            {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                                        </div>
                                                        <span className={cn(
                                                            "text-sm font-medium",
                                                            isSelected ? "text-foreground" : "text-muted-foreground"
                                                        )}>
                                                            {causa.nome}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button type="button" variant="ghost" className="flex-1" onClick={prevStep}>Voltar</Button>
                                            <Button type="submit" className="flex-1" disabled={processing || data.causas_apoiadas.length === 0}>
                                                {processing ? 'Criando...' : 'Finalizar Cadastro'}
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

            {/* Coluna direita — painel decorativo */}
            <div className="relative hidden bg-brand lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-soft/20 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
                </div>
                <div className="relative z-10 max-w-sm text-center text-primary-foreground">
                    <div className="mb-6 flex justify-center">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                            <span className="text-3xl">🤝</span>
                        </div>
                    </div>
                    <h2 className="font-display text-3xl font-bold leading-tight">
                        Conectando quem quer ajudar com quem precisa.
                    </h2>
                    <p className="mt-4 text-primary-foreground/80">
                        Faça parte da rede Impacta e transforme intenções em impacto real.
                    </p>
                </div>
            </div>
        </div>
    );
}
