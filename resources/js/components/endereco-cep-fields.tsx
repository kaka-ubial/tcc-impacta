import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    maskCep,
    fetchCep,
    type EnderecoFields,
} from '@/lib/validators';

type Props = {
    value: EnderecoFields;
    onChange: (fields: EnderecoFields) => void;
    errors?: Partial<Record<keyof EnderecoFields | 'cep', string>>;
};

const UFS = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export default function EnderecoCepFields({ value, onChange, errors }: Props) {
    const [loading, setLoading] = useState(false);
    const [cepError, setCepError] = useState('');

    function update(field: keyof EnderecoFields, v: string) {
        onChange({ ...value, [field]: v });
    }

    async function handleCepBlur() {
        const digits = value.cep.replace(/\D/g, '');
        if (digits.length !== 8) {
            if (digits.length > 0) setCepError('CEP deve ter 8 dígitos');
            return;
        }

        setCepError('');
        setLoading(true);
        const result = await fetchCep(value.cep);
        setLoading(false);

        if (!result) {
            setCepError('CEP não encontrado');
            return;
        }

        onChange({
            ...value,
            logradouro: result.logradouro || value.logradouro,
            bairro: result.bairro || value.bairro,
            cidade: result.localidade || value.cidade,
            uf: result.uf || value.uf,
        });
    }

    function handleCepChange(raw: string) {
        const masked = maskCep(raw);
        update('cep', masked);
        setCepError('');

        const digits = raw.replace(/\D/g, '');
        if (digits.length === 8) {
            setCepError('');
            setLoading(true);
            fetchCep(digits).then((result) => {
                setLoading(false);
                if (!result) {
                    setCepError('CEP não encontrado');
                    return;
                }
                onChange({
                    ...value,
                    cep: maskCep(digits),
                    logradouro: result.logradouro || value.logradouro,
                    bairro: result.bairro || value.bairro,
                    cidade: result.localidade || value.cidade,
                    uf: result.uf || value.uf,
                });
            });
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                    <Input
                        id="cep"
                        value={value.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        maxLength={9}
                    />
                    {loading && (
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <Spinner />
                        </div>
                    )}
                </div>
                {(cepError || errors?.cep) && (
                    <span className="text-destructive text-xs">{cepError || errors?.cep}</span>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                    id="logradouro"
                    value={value.logradouro}
                    onChange={(e) => update('logradouro', e.target.value)}
                    placeholder="Rua, Avenida..."
                    readOnly={!!value.logradouro && loading}
                />
                {errors?.logradouro && (
                    <span className="text-destructive text-xs">{errors.logradouro}</span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="numero">Numero</Label>
                    <Input
                        id="numero"
                        value={value.numero}
                        onChange={(e) => update('numero', e.target.value)}
                        placeholder="123"
                    />
                    {errors?.numero && (
                        <span className="text-destructive text-xs">{errors.numero}</span>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                        id="complemento"
                        value={value.complemento}
                        onChange={(e) => update('complemento', e.target.value)}
                        placeholder="Apto, Bloco..."
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                    id="bairro"
                    value={value.bairro}
                    onChange={(e) => update('bairro', e.target.value)}
                    placeholder="Bairro"
                    readOnly={!!value.bairro && loading}
                />
                {errors?.bairro && (
                    <span className="text-destructive text-xs">{errors.bairro}</span>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 flex flex-col gap-1">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                        id="cidade"
                        value={value.cidade}
                        onChange={(e) => update('cidade', e.target.value)}
                        placeholder="Cidade"
                        readOnly={!!value.cidade && loading}
                    />
                    {errors?.cidade && (
                        <span className="text-destructive text-xs">{errors.cidade}</span>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="uf">UF</Label>
                    <Input
                        id="uf"
                        value={value.uf}
                        onChange={(e) => update('uf', e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="UF"
                        maxLength={2}
                        readOnly={!!value.uf && loading}
                    />
                    {errors?.uf && (
                        <span className="text-destructive text-xs">{errors.uf}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
