import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AlertSuccess from '@/components/ui/alert-success';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verifique seu email"
            description="Verifique seu endereço de email clicando no link que enviamos para você."
        >
            <Head title="Verificação de email" />

            {status === 'verification-link-sent' && (
                <div className="mb-4">
                    <AlertSuccess message="Um novo link de verificação foi enviado para o endereço de email que você cadastrou." />
                </div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            Reenviar email de verificação
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            Sair
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
