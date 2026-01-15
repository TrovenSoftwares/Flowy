import React from 'react';
import { WhatsAppIcon } from './BrandedIcons';
import { toast } from 'react-hot-toast';

const WhatsAppChat: React.FC = () => {
    const toggleChat = () => {
        // Chatwoot pode levar alguns segundos para injetar o $chatwoot no window
        if (window.$chatwoot) {
            window.$chatwoot.toggle();
        } else {
            toast.loading('Iniciando chat...', { id: 'chat-loading', duration: 2000 });

            const checkInterval = setInterval(() => {
                if (window.$chatwoot) {
                    toast.success('Chat pronto!', { id: 'chat-loading' });
                    window.$chatwoot.toggle();
                    clearInterval(checkInterval);
                }
            }, 500);

            setTimeout(() => {
                if (!window.$chatwoot) {
                    toast.error('Erro ao carregar o chat. Tente novamente.', { id: 'chat-loading' });
                    clearInterval(checkInterval);
                }
            }, 6000);
        }
    };

    React.useEffect(() => {
        // Garantir que as configurações sejam aplicadas sem sobrescrever o onSDKReady do index.html
        window.chatwootSettings = {
            ...window.chatwootSettings,
            hideMessageBubble: true,
            position: 'right',
            locale: 'pt_BR',
        };
    }, []);

    return (
        <button
            onClick={toggleChat}
            className="fixed bottom-8 right-8 z-50 group flex items-center gap-3 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500"
            aria-label="Falar conosco no WhatsApp"
        >
            {/* Legend Tag */}
            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 pointer-events-none">
                <p className="text-slate-900 dark:text-white text-xs font-black whitespace-nowrap">Como posso ajudar?</p>
            </div>

            {/* Icon Container */}
            <div className="relative">
                {/* Notification Badge */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full z-10 animate-pulse"></div>

                {/* Main Button */}
                <div className="w-16 h-16 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/30 group-hover:shadow-green-500/50 group-hover:-translate-y-2 transition-all duration-300">
                    <svg className="w-10 h-10 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .062 5.388.059 11.994c0 2.112.551 4.174 1.597 6.01L0 24l6.135-1.61a11.822 11.822 0 005.913 1.586h.005c6.602 0 11.986-5.389 11.989-11.996a11.81 11.81 0 00-3.529-8.463z" />
                    </svg>
                </div>

                {/* Ring Animation */}
                <div className="absolute inset-0 bg-green-500/20 rounded-2xl animate-ping -z-10"></div>
            </div>
        </button>
    );
};

// Add global type for Chatwoot
declare global {
    interface Window {
        $chatwoot: any;
        chatwootSDK: any;
        chatwootSettings: any;
    }
}

export default WhatsAppChat;
