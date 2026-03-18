import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { checkRateLimit } from '../services/api/axiosConfig';

export const useApi = (apiFunction, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rateLimit, setRateLimit] = useState(null);

    const retryCount = useRef(0);
    const maxRetries = options.maxRetries || 2;

    const execute = useCallback(async (...params) => {
        // Verificar rate limit antes de ejecutar
        const rateLimitActive = checkRateLimit();
        if (rateLimitActive) {
            const rateLimitError = {
                rateLimit: true,
                message: rateLimitActive.mensaje,
                timeLeft: Math.ceil((rateLimitActive.expira - Date.now()) / 1000)
            };
            setRateLimit(rateLimitError);
            throw rateLimitError;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await apiFunction(...params);
            setData(result);
            retryCount.current = 0;
            return result;

        } catch (err) {
            console.error("Error en API:", err);

            // Manejo especial para rate limit
            if (err.rateLimit || err.response?.status === 429) {
                const rateLimitInfo = err.rateLimitInfo || {
                    retryAfter: 60,
                    mensaje: 'Demasiadas peticiones'
                };

                setRateLimit(rateLimitInfo);

                toast.error(
                    <div className="flex flex-col gap-1">
                        <p className="font-semibold">Limite de peticiones</p>
                        <p className="text-sm">{rateLimitInfo.mensaje}</p>
                        <p className="text-xs">Espera {rateLimitInfo.retryAfter} segundos</p>
                    </div>,
                    { duration: 5000 }
                );

                // Reintentar automático para admins
                if (options.autoRetry && rateLimitInfo.esAdmin) {
                    setTimeout(() => {
                        execute(...params);
                    }, rateLimitInfo.retryAfter * 1000);
                }
            }

            setError(err);
            throw err;

        } finally {
            setLoading(false);
        }
    }, [apiFunction, options.autoRetry, maxRetries]);

    return {
        data,
        loading,
        error,
        rateLimit,
        execute,
        reset: () => {
            setData(null);
            setError(null);
            setRateLimit(null);
            retryCount.current = 0;
        }
    };
};