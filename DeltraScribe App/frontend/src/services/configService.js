import apiClient from '../api/client';

const configService = {
    configs: null,

    async fetchConfigs() {
        try {
            const response = await apiClient.get('/configs');
            this.configs = response.data.reduce((acc, config) => {
                acc[config.configKey] = config.configValue;
                return acc;
            }, {});
            return this.configs;
        } catch (error) {
            console.error('Error fetching configs:', error);
            return {};
        }
    },

    getConfig(key, defaultValue) {
        return (this.configs && this.configs[key]) || defaultValue;
    }
};

export default configService;
