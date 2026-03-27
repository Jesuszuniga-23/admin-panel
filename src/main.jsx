// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App'; // ✅ CORREGIDO: Importar App, no AppRouter
import './index.css';

// ✅ Validar configuración de Google Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error('❌ VITE_GOOGLE_CLIENT_ID no está configurado en las variables de entorno');
  
  // ✅ Mostrar error en la UI si no está configurado
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 16px;">
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="width: 64px; height: 64px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg style="width: 32px; height: 32px; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 style="font-size: 1.5rem; font-weight: bold; color: #991b1b; margin-bottom: 8px;">Error de configuración</h2>
          <p style="color: #b91c1c; margin-bottom: 16px;">La aplicación no está correctamente configurada.</p>
          <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 24px;">Falta la variable de entorno VITE_GOOGLE_CLIENT_ID</p>
          <button 
            onclick="window.location.reload()"
            style="background: #dc2626; color: white; padding: 8px 24px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.875rem;"
          >
            Reintentar
          </button>
        </div>
      </div>
    `;
  }
  throw new Error('VITE_GOOGLE_CLIENT_ID no está configurado');
}

// ✅ Verificar que el elemento root existe
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ No se encontró el elemento con id "root" en el DOM');
  throw new Error('No se encontró el elemento root');
}

// ✅ Función para renderizar con manejo de errores
const renderApp = () => {
  try {
    console.log('🚀 Iniciando aplicación...');
    console.log('📧 Google Client ID configurado:', GOOGLE_CLIENT_ID ? '✅ Sí' : '❌ No');
    
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      </React.StrictMode>
    );
    
    console.log('✅ Aplicación montada correctamente');
  } catch (error) {
    console.error('❌ Error montando la aplicación:', error);
    
    // ✅ Mostrar error en la UI
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 16px;">
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="width: 64px; height: 64px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg style="width: 32px; height: 32px; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 style="font-size: 1.5rem; font-weight: bold; color: #991b1b; margin-bottom: 8px;">Error al cargar la aplicación</h2>
          <p style="color: #6b7280; margin-bottom: 24px;">${error.message || 'Error desconocido'}</p>
          <button 
            onclick="window.location.reload()"
            style="background: #2563eb; color: white; padding: 8px 24px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.875rem;"
          >
            Reintentar
          </button>
        </div>
      </div>
    `;
  }
};

// ✅ Ejecutar renderizado
renderApp();