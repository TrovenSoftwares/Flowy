const EVO_URL = 'https://wpp.troven.com.br';
const EVO_API_KEY = 'f8a3f17b6fd97f3dfe5609e06b4a0bde831f81843c56449399f0b1ad8e91066b';

export interface EvoInstance {
    instanceName: string;
    status: 'open' | 'connecting' | 'closed';
}

export const evolutionApi = {
    async fetchInstances() {
        try {
            const response = await fetch(`${EVO_URL}/instance/fetchInstances`, {
                headers: { 'apikey': EVO_API_KEY }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching instances:', error);
            return [];
        }
    },

    async createInstance(instanceName: string, token: string, extraConfig?: any) {
        try {
            const body = {
                instanceName: instanceName,
                token: token,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS",
                ...extraConfig
            };


            const response = await fetch(`${EVO_URL}/instance/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVO_API_KEY
                },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            console.error('Error creating instance:', error);
            throw error;
        }
    },

    async connectInstance(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/instance/connect/${encodeURIComponent(instanceName)}`, {
                headers: { 'apikey': EVO_API_KEY }
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            console.error('Error connecting instance:', error);
            throw error;
        }
    },

    async getInstanceStatus(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/instance/connectionState/${encodeURIComponent(instanceName)}`, {
                headers: { 'apikey': EVO_API_KEY }
            });
            const data = await response.json();
            return data.instance?.state || 'closed';
        } catch (error) {
            console.error('Error getting status:', error);
            return 'closed';
        }
    },

    async findSettings(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/settings/find/${encodeURIComponent(instanceName)}`, {
                headers: { 'apikey': EVO_API_KEY }
            });
            return await response.json();
        } catch (error) {
            console.error('Error finding settings:', error);
            return null;
        }
    },

    async updateSettings(instanceName: string, settings: any) {
        try {
            const response = await fetch(`${EVO_URL}/settings/set/${encodeURIComponent(instanceName)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVO_API_KEY
                },
                body: JSON.stringify(settings)
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    },

    async logoutInstance(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/instance/logout/${encodeURIComponent(instanceName)}`, {
                method: 'DELETE',
                headers: { 'apikey': EVO_API_KEY }
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    },

    async deleteInstance(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/instance/delete/${encodeURIComponent(instanceName)}`, {
                method: 'DELETE',
                headers: { 'apikey': EVO_API_KEY }
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            console.error('Error deleting instance:', error);
            throw error;
        }
    },

    async fetchMessages(instanceName: string, remoteJid: string, page = 1) {
        try {
            const response = await fetch(`${EVO_URL}/chat/fetchMessages/${encodeURIComponent(instanceName)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVO_API_KEY
                },
                body: JSON.stringify({
                    where: {
                        remoteJid,
                    },
                    page
                })
            });
            const data = await response.json();
            if (!response.ok) return [];
            return data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    },

    async findWebhooks(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/webhook/find/${encodeURIComponent(instanceName)}`, {
                headers: { 'apikey': EVO_API_KEY }
            });
            const data = await response.json();
            if (!response.ok) return null;
            return data;
        } catch (error) {
            console.error('Error finding webhooks:', error);
            return null;
        }
    },

    async setWebhook(instanceName: string, config: any) {
        try {
            const response = await fetch(`${EVO_URL}/webhooks/set/${encodeURIComponent(instanceName)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVO_API_KEY
                },
                body: JSON.stringify({
                    webhook: config
                })
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            console.error('Error setting webhook:', error);
            throw error;
        }
    },

    async fetchGroups(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/group/fetchAllGroups/${encodeURIComponent(instanceName)}?getParticipants=false`, {
                method: 'GET',
                headers: { 'apikey': EVO_API_KEY }
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            console.error('Error fetching groups:', error);
            throw error;
        }
    },

    async sendText(instanceName: string, number: string, text: string) {
        try {
            const response = await fetch(`${EVO_URL}/message/sendText/${encodeURIComponent(instanceName)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVO_API_KEY
                },
                body: JSON.stringify({
                    number: number,
                    text: text,
                    delay: 1200, // Debounce delay
                    linkPreview: true
                })
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            console.error('Error sending text via Evolution:', error);
            throw error;
        }
    }
};
