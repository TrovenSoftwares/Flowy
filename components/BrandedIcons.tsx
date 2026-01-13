import React from 'react';

interface IconProps {
    className?: string;
}

export const GoogleIcon: React.FC<IconProps> = ({ className = "size-5" }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export const MicrosoftIcon: React.FC<IconProps> = ({ className = "size-5" }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.4 24H0V12.6h11.4V24z" fill="#f25022" />
        <path d="M24 24H12.6V12.6H24V24z" fill="#7fbb00" />
        <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#00a1f1" />
        <path d="M24 11.4H12.6V0H24v11.4z" fill="#ffbb00" />
    </svg>
);

export const WhatsAppIcon: React.FC<IconProps> = ({ className = "size-5" }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .062 5.388.059 11.994c0 2.112.551 4.174 1.597 6.01L0 24l6.135-1.61a11.822 11.822 0 005.913 1.586h.005c6.602 0 11.986-5.389 11.989-11.996a11.81 11.81 0 00-3.529-8.463z" fill="#25D366" />
    </svg>
);

export const VersixLogo: React.FC<IconProps> = ({ className = "h-12" }) => (
    <img
        src="/logo.png"
        alt="Versix Logo"
        className={className}
        style={{ objectFit: 'contain' }}
    />
);

export const PdfIcon: React.FC<IconProps> = ({ className = "size-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 8v8h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2zm-7 4h2a2 2 0 1 0 0-4H3v8m14-4h3m1-4h-4v8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
);

export const ExcelIcon: React.FC<IconProps> = ({ className = "size-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 7V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 9L12 15M12 9L8 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 5V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

export const ImportIcon: React.FC<IconProps> = ({ className = "size-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3V16M12 16L16 12M12 16L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 10V17C20 19.2091 18.2091 21 16 21H8C5.79086 21 4 19.2091 4 17V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);
