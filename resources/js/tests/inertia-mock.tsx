/* eslint-disable @typescript-eslint/no-unused-vars -- props do Inertia são descartadas de propósito no mock */
import React, { useState } from 'react';
import { vi } from 'vitest';

export const pageState: { props: Record<string, any>; url: string } = {
    props: {},
    url: '/',
};

export function setPage(props: Record<string, any> = {}, url = '/') {
    pageState.props = {
        name: 'Impacta',
        sidebarOpen: true,
        errors: {},
        auth: { user: null },
        notificacoes_nao_lidas: 0,
        notificacoes_recentes: [],
        ...props,
    };
    pageState.url = url;
}

export const formBehavior: {
    mode: 'success' | 'error';
    errors: Record<string, string>;
} = { mode: 'success', errors: { motivo: 'erro' } };
export const formCalls: { method: string; args: any[] }[] = [];

export const router = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    visit: vi.fn(),
    reload: vi.fn(),
    flushAll: vi.fn(),
    on: vi.fn(() => () => {}),
};

const hrefOf = (h: any) => (typeof h === 'string' ? h : (h?.url ?? '#'));

export const Link = React.forwardRef<HTMLAnchorElement, any>(function Link(
    {
        href,
        children,
        method,
        as,
        preserveScroll,
        preserveState,
        prefetch,
        viewTransition,
        ...rest
    },
    ref,
) {
    return (
        <a ref={ref} href={hrefOf(href)} {...rest}>
            {children}
        </a>
    );
});

export const Head = () => null;

export const formSubmits: {
    action: any;
    data: Record<string, FormDataEntryValue>;
}[] = [];

export function Form({
    children,
    action,
    method,
    resetOnSuccess,
    resetOnError,
    options,
    transform,
    onSuccess,
    onError,
    onFinish,
    onBefore,
    disableWhileProcessing,
    errorBag,
    setDefaultsOnSuccess,
    ...rest
}: any) {
    const [errors, setErrors] = useState<Record<string, any>>(
        pageState.props.formErrors ?? {},
    );
    const [processing, setProcessing] = useState(false);
    const [wasSuccessful, setWasSuccessful] = useState(false);
    const state = {
        errors,
        hasErrors: Object.keys(errors).length > 0,
        processing,
        progress: null,
        wasSuccessful,
        recentlySuccessful: wasSuccessful,
        isDirty: false,
        clearErrors: vi.fn(() => setErrors({})),
        resetAndClearErrors: vi.fn(() => setErrors({})),
        defaults: vi.fn(),
        reset: vi.fn(),
        setError: vi.fn((k: any, v?: any) =>
            setErrors((e) =>
                typeof k === 'string' ? { ...e, [k]: v } : { ...e, ...k },
            ),
        ),
    };
    const a = typeof action === 'string' ? action : action?.url;

    return (
        <form
            action={a}
            method={typeof action === 'object' ? action.method : method}
            onSubmit={(e) => {
                e.preventDefault();
                const data = Object.fromEntries(
                    new FormData(e.currentTarget).entries(),
                );
                formSubmits.push({ action, data });

                if (formBehavior.mode === 'error') {
                    setErrors(formBehavior.errors);
                    onError?.(formBehavior.errors);
                } else {
                    setErrors({});
                    setWasSuccessful(true);
                    onSuccess?.({ props: pageState.props });
                }

                onFinish?.();
            }}
            {...rest}
        >
            {typeof children === 'function' ? children(state) : children}
        </form>
    );
}

export function useForm<T extends Record<string, any>>(initial: T = {} as T) {
    const [data, setDataState] = useState<T>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const form: any = {
        data,
        setData: (k: any, v?: any) =>
            typeof k === 'string'
                ? setDataState((d) => ({ ...d, [k]: v }))
                : setDataState((d) => ({
                      ...d,
                      ...(typeof k === 'function' ? k(d) : k),
                  })),
        errors,
        hasErrors: Object.keys(errors).length > 0,
        processing,
        wasSuccessful: false,
        recentlySuccessful: false,
        isDirty: false,
        progress: null,
        reset: vi.fn(() => setDataState(initial)),
        clearErrors: vi.fn(() => setErrors({})),
        setError: vi.fn((k: any, v?: any) =>
            setErrors((e) =>
                typeof k === 'string' ? { ...e, [k]: v } : { ...e, ...k },
            ),
        ),
        transform: vi.fn(),
        defaults: vi.fn(),
        setDefaults: vi.fn(),
        cancel: vi.fn(),
    };

    for (const m of ['get', 'post', 'put', 'patch', 'delete', 'submit']) {
        form[m] = vi.fn((...args: any[]) => {
            formCalls.push({ method: m, args });
            const opts = args.find(
                (a) =>
                    a &&
                    typeof a === 'object' &&
                    !Array.isArray(a) &&
                    ('onSuccess' in a || 'onError' in a || 'onFinish' in a),
            );

            if (formBehavior.mode === 'error') {
                setErrors(formBehavior.errors);
                opts?.onError?.(formBehavior.errors);
            } else {
                opts?.onSuccess?.({ props: pageState.props });
            }

            opts?.onFinish?.();
            setProcessing(false);
        });
    }

    (useForm as any).last = form;

    return form;
}

export const usePage = () => ({
    props: pageState.props,
    url: pageState.url,
    component: 'Test',
    version: '1',
});
export const usePoll = vi.fn();
export const useRemember = (v: any) => useState(v);
export const WhenVisible = ({ children }: any) => <>{children}</>;
export const Deferred = ({ children }: any) => <>{children}</>;
export const createInertiaApp = vi.fn();
