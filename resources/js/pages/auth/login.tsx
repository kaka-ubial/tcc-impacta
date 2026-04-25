import { Form, Head, Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';

import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import AlertSuccess from '@/components/ui/alert-success';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home, register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
    return (
        <div className="flex min-h-svh flex-col bg-warm-neutral">
            <Head title="Entrar" />

            {/* Logo bar */}
            <header className="flex h-14 shrink-0 items-center px-6">
                <Link
                    href={home()}
                    className="flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-75"
                >
                    <div className="flex size-7 items-center justify-center rounded-md bg-brand text-primary-foreground">
                        <Heart className="size-4" />
                    </div>
                    Impacta
                </Link>
            </header>

            {/* Centered form */}
            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-[420px]">

                    {/* Heading */}
                    <div className="mb-8">
                        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                            Entre na sua conta
                        </h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            Preencha o e-mail e a senha para continuar.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-6">
                            <AlertSuccess message={status} />
                        </div>
                    )}

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="flex flex-col gap-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="flex flex-col gap-5">

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="email" className="text-sm font-medium">
                                            E-mail
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="seu@email.com"
                                            className="h-11"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-sm font-medium">
                                                Senha
                                            </Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                                                    tabIndex={5}
                                                >
                                                    Esqueceu a senha?
                                                </TextLink>
                                            )}
                                        </div>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="Sua senha"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                        />
                                        <Label
                                            htmlFor="remember"
                                            className="cursor-pointer text-sm font-normal text-muted-foreground"
                                        >
                                            Lembre-se de mim
                                        </Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="h-11 w-full font-semibold"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && <Spinner />}
                                        Entrar
                                    </Button>
                                </div>

                                {canRegister && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        Não tem uma conta?{' '}
                                        <TextLink
                                            href={register()}
                                            tabIndex={6}
                                            className="font-medium text-foreground transition-colors hover:text-brand"
                                        >
                                            Criar conta
                                        </TextLink>
                                    </p>
                                )}
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
}
