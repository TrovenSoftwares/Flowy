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

    async createInstance(instanceName: string, token?: string) {
        try {
            const finalToken = token || Math.random().toString(36).substring(7);
            const response = await fetch(`${EVO_URL}/instance/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVO_API_KEY
                },
                body: JSON.stringify({
                    instanceName,
                    token: finalToken,
                    qrcode: true,
                    integration: 'WHATSAPP-BAILEYS'
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                // Check if error is "instance already exists" - 403 or specific message
                if (response.status === 403 || errorData.includes('already exists')) {
                    // If it exists, we might still want to return success so the frontend can save the key presumably used? 
                    // Actually, if it exists we can't change the token usually. 
                    // But let's throw detailed error so frontend handles it.
                }
                console.error('Evolution API Error:', errorData);
                throw new Error(errorData || 'Failed to create instance');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating instance:', error);
            throw error;
        }
    },

    async connectInstance(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/instance/connect/${instanceName}`, {
                headers: { 'apikey': EVO_API_KEY }
            });
            return await response.json();
        } catch (error) {
            console.error('Error connecting instance:', error);
            throw error;
        }
    },

    async getInstanceStatus(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/instance/connectionState/${instanceName}`, {
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
            const response = await fetch(`${EVO_URL}/settings/find/${instanceName}`, {
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
            const response = await fetch(`${EVO_URL}/settings/set/${instanceName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVO_API_KEY
                },
                body: JSON.stringify(settings)
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    },

    async logoutInstance(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': EVO_API_KEY }
            });
            return await response.json();
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    },

    async deleteInstance(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/instance/delete/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': EVO_API_KEY }
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting instance:', error);
            throw error;
        }
    },

    async fetchMessages(instanceName: string, remoteJid: string, page = 1) {
        try {
            const response = await fetch(`${EVO_URL}/chat/fetchMessages/${instanceName}`, {
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
            return await response.json();
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    },

    async findWebhooks(instanceName: string) {
        try {
            const response = await fetch(`${EVO_URL}/webhook/find/${instanceName}`, {
                headers: { 'apikey': EVO_API_KEY }
            });
            return await response.json();
        } catch (error) {
            console.error('Error finding webhooks:', error);
            return null;
        }
    },

    async setWebhook(instanceName: string, config: any) {
        try {
            const response = await fetch(`${EVO_URL}/webhook/set/${instanceName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVO_API_KEY
                },
                body: JSON.stringify(config)
            });
            return await response.json();
        } catch (error) {
            console.error('Error setting webhook:', error);
            throw error;
        }
    }
};
