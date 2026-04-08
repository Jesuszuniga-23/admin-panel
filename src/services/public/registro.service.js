import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class RegistroService {
    async obtenerPlanes() {
        try {
            const response = await axiosInstance.get(ENDPOINTS.PUBLIC.PLANES);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo planes:', error);
            throw error.response?.data || { error: 'Error al obtener planes' };
        }
    }

    async registrarMunicipio(data) {
        try {
            const response = await axiosInstance.post(ENDPOINTS.PUBLIC.REGISTER_MUNICIPIO, data);
            return response.data;
        } catch (error) {
            console.error('Error registrando municipio:', error);
            throw error.response?.data || { error: 'Error al registrar municipio' };
        }
    }
}

export default new RegistroService();