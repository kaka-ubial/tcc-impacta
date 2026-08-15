import type { SVGAttributes } from 'react';
import logo_impacta from '../../assets/logo_impacta.png';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <img src={logo_impacta} alt="Logo Impacta" />
    );
}
