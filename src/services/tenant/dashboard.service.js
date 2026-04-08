import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class DashboardTenantService {
    async descargarOrdenPago() {
        try {
            const response = await axiosInstance.get(ENDPOINTS.TENANT_DASHBOARD.ORDEN_PAGO, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'orden-pago.pdf';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) filename = match[1];
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error) {
            console.error('Error descargando orden de pago:', error);
            throw error.response?.data || { error: 'Error al descargar orden de pago' };
        }
    }
}

export default new DashboardTenantService();