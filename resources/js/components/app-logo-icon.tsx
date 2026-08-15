import type { ImgHTMLAttributes } from 'react';
import logo_impacta from '../../assets/logo_impacta.png';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img {...props} src={logo_impacta} alt="Logo Impacta" />
    );
}
