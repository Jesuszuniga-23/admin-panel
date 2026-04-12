// src/services/admin/reportesGraficas.service.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

const corregirTexto = (texto) => {
  if (!texto) return '';
  if (typeof texto !== 'string') return texto.toString();
  
  const correcciones = [
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã±', para: 'ñ' },
    { de: 'Ã�', para: 'Á' }, { de: 'Ã‰', para: 'É' }, { de: 'Ã�', para: 'Í' },
    { de: 'Ã“', para: 'Ó' }, { de: 'Ãš', para: 'Ú' }, { de: 'Ã‘', para: 'Ñ' },
    { de: 'Â¿', para: '¿' }, { de: 'Â¡', para: '¡' },
    { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' }, { de: '€', para: 'é' },
    { de: '‚', para: 'é' }, { de: '¢', para: 'ó' }
  ];
  
  let textoCorregido = texto;
  correcciones.forEach(({ de, para }) => {
    textoCorregido = textoCorregido.split(de).join(para);
  });
  
  return textoCorregido;
};

const formatearFechaLarga = (fecha) => {
  if (!fecha) return '—';
  try {
    const f = new Date(fecha);
    if (isNaN(f.getTime())) return '—';
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const diaSemana = dias[f.getDay()];
    const dia = f.getDate();
    const mes = meses[f.getMonth()];
    const año = f.getFullYear();
    const hora = f.getHours().toString().padStart(2, '0');
    const minuto = f.getMinutes().toString().padStart(2, '0');
    
    return `${diaSemana}, ${dia} de ${mes} de ${año} a las ${hora}:${minuto}`;
  } catch (e) {
    return '—';
  }
};

const formatearFecha = (fecha) => {
  if (!fecha) return '—';
  try {
    const f = new Date(fecha);
    if (isNaN(f.getTime())) return '—';
    return f.toLocaleDateString('es-MX');
  } catch (e) {
    return '—';
  }
};

const obtenerTextoFiltros = (filtros) => {
  const filtrosAplicados = [];
  
  const formatearFechaLocal = (fechaStr) => {
    if (!fechaStr) return '';
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  };
  
  if (filtros.fechaInicio && filtros.fechaFin) {
    const desde = formatearFechaLocal(filtros.fechaInicio);
    const hasta = formatearFechaLocal(filtros.fechaFin);
    filtrosAplicados.push(`Período: ${desde} - ${hasta}`);
  } else if (filtros.fechaInicio) {
    filtrosAplicados.push(`Desde: ${formatearFechaLocal(filtros.fechaInicio)}`);
  } else if (filtros.fechaFin) {
    filtrosAplicados.push(`Hasta: ${formatearFechaLocal(filtros.fechaFin)}`);
  }
  
  if (filtros.tipo && filtros.tipo !== 'todos') {
    filtrosAplicados.push(`Tipo: ${filtros.tipo === 'panico' ? 'Pánico' : 'Médica'}`);
  }
  
  if (filtros.estado && filtros.estado !== 'todos') {
    const estados = {
      activa: 'Activas', proceso: 'En Proceso', cerrada: 'Cerradas', expirada: 'Expiradas'
    };
    filtrosAplicados.push(`Estado: ${estados[filtros.estado] || filtros.estado}`);
  }
  
  if (filtros.zona && filtros.zona !== 'todas') {
    filtrosAplicados.push(`Zona: ${filtros.zona}`);
  }
  
  return filtrosAplicados;
};

const esImagenValida = (imgData) => {
  return imgData && typeof imgData === 'string' && imgData.startsWith('data:image');
};

const calcularDimensionesOptimas = (img, anchoMaximo = 180, altoMaximo = 120) => {
  return new Promise((resolve) => {
    if (!esImagenValida(img)) {
      resolve({ ancho: anchoMaximo, alto: altoMaximo });
      return;
    }
    
    const image = new Image();
    const timeoutId = setTimeout(() => {
      resolve({ ancho: anchoMaximo, alto: altoMaximo });
    }, 5000);
    
    image.onload = () => {
      clearTimeout(timeoutId);
      const proporcion = image.width / image.height;
      let anchoFinal = anchoMaximo;
      let altoFinal = anchoMaximo / proporcion;
      
      if (altoFinal > altoMaximo) {
        altoFinal = altoMaximo;
        anchoFinal = altoMaximo * proporcion;
      }
      
      resolve({ ancho: Math.round(anchoFinal), alto: Math.round(altoFinal) });
    };
    
    image.onerror = () => {
      clearTimeout(timeoutId);
      resolve({ ancho: anchoMaximo, alto: altoMaximo });
    };
    
    image.src = img;
  });
};

// =====================================================
// CLASE PRINCIPAL
// =====================================================

class ReportesGraficasService {
  
  async generarPDFConGraficas(datos, tipo, filtros, usuario, graficas, options = {}) {
    try {
      console.log('📄 Generando PDF con gráficas...');
      
      if (options.signal?.aborted) {
        throw new Error('AbortError');
      }
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const COLOR_PRIMARIO = [30, 58, 138];
      const COLOR_SECUNDARIO = [37, 99, 235];
      const COLOR_TERCIARIO = [99, 102, 241];
      
      const fecha = formatearFechaLarga(new Date());
      
      // =====================================================
      // PÁGINA 1: INFORMACIÓN GENERAL
      // =====================================================
      
      // Encabezado
      doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
      doc.rect(0, 0, 210, 22, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA DE EMERGENCIAS', 15, 13);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Análisis Geográfico de Incidentes', 15, 19);
      
      let yPos = 28;
      
      // Tarjeta de información
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(200, 210, 230);
      doc.roundedRect(15, yPos, 180, 42, 3, 3, 'FD');
      
      doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
      doc.rect(15, yPos, 3, 42, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL REPORTE', 25, yPos + 7);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Fecha de emisión:', 25, yPos + 16);
      doc.text(fecha, 55, yPos + 16);
      
      doc.text('Total registros:', 25, yPos + 24);
      doc.text(datos.length.toString(), 55, yPos + 24);
      
      doc.text('Con ubicación:', 25, yPos + 32);
      doc.text(graficas.estadisticas?.conUbicacion?.toString() || '0', 55, yPos + 32);
      
      doc.text('Generado por:', 110, yPos + 16);
      doc.text(corregirTexto(usuario?.nombre || 'Sistema'), 135, yPos + 16);
      
      doc.text('Email:', 110, yPos + 24);
      doc.text(usuario?.email || '—', 135, yPos + 24);
      
      doc.text('Rol:', 110, yPos + 32);
      doc.text(usuario?.rol || '—', 135, yPos + 32);
      
      yPos += 50;
      
      // Filtros aplicados
      const filtrosAplicados = obtenerTextoFiltros(filtros);
      
      if (filtrosAplicados.length > 0) {
        doc.setFillColor(240, 244, 250);
        doc.roundedRect(15, yPos, 180, 15 + (Math.ceil(filtrosAplicados.length / 2) * 6), 2, 2, 'FD');
        
        doc.setTextColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('FILTROS APLICADOS:', 25, yPos + 6);
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        
        let filtroY = yPos + 6;
        let columna = 0;
        
        filtrosAplicados.forEach((filtro) => {
          const colX = [70, 130][columna];
          doc.text(filtro, colX, filtroY);
          columna++;
          if (columna === 2) {
            columna = 0;
            filtroY += 6;
          }
        });
        
        yPos += 20 + (Math.ceil(filtrosAplicados.length / 2) * 6);
      } else {
        doc.setFillColor(240, 244, 250);
        doc.roundedRect(15, yPos, 180, 12, 2, 2, 'FD');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('Sin filtros aplicados - Mostrando todos los registros', 25, yPos + 8);
        yPos += 18;
      }
      
      // Resumen de estadísticas (tarjetas)
      if (graficas.estadisticas) {
        const stats = graficas.estadisticas;
        
        doc.setFillColor(COLOR_TERCIARIO[0], COLOR_TERCIARIO[1], COLOR_TERCIARIO[2]);
        doc.roundedRect(15, yPos, 180, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('📊 RESUMEN DE ESTADÍSTICAS', 25, yPos + 5.5);
        
        yPos += 14;
        
        // Tarjetas en formato 2x4
        const tarjetas = [
          { label: 'Total', value: stats.total || 0, color: [99, 102, 241] },
          { label: 'Pánico', value: stats.panico || 0, color: [239, 68, 68] },
          { label: 'Médica', value: stats.medica || 0, color: [16, 185, 129] },
          { label: 'Activas', value: stats.activas || 0, color: [239, 68, 68] },
          { label: 'En Proceso', value: stats.proceso || 0, color: [59, 130, 246] },
          { label: 'Cerradas', value: stats.cerradas || 0, color: [16, 185, 129] },
          { label: 'Expiradas', value: stats.expiradas || 0, color: [107, 114, 128] },
          { label: 'Con ubicación', value: stats.conUbicacion || 0, color: [34, 197, 94] }
        ];
        
        const anchoTarjeta = 42;
        const alturaTarjeta = 16;
        let tarjetaX = 15;
        let tarjetaY = yPos;
        
        tarjetas.forEach((tarjeta, idx) => {
          if (idx === 4) {
            tarjetaX = 15;
            tarjetaY += alturaTarjeta + 3;
          }
          
          doc.setFillColor(245, 247, 250);
          doc.setDrawColor(200, 210, 230);
          doc.roundedRect(tarjetaX, tarjetaY, anchoTarjeta, alturaTarjeta, 2, 2, 'FD');
          
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');
          doc.text(tarjeta.label, tarjetaX + 2, tarjetaY + 5);
          
          doc.setTextColor(tarjeta.color[0], tarjeta.color[1], tarjeta.color[2]);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(String(tarjeta.value), tarjetaX + 2, tarjetaY + 12);
          
          tarjetaX += anchoTarjeta + 3;
        });
        
        yPos = tarjetaY + alturaTarjeta + 10;
      }
      
      if (options.signal?.aborted) throw new Error('AbortError');
      
      // =====================================================
      // PÁGINA 2: MAPA PRINCIPAL
      // =====================================================
      if (graficas.mapa && esImagenValida(graficas.mapa)) {
        doc.addPage();
        yPos = 20;
        
        doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('🗺️ MAPA DE INCIDENTES', 15, 10);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Ubicaciones visibles: ${graficas.estadisticas?.conUbicacion || 0} puntos`, 15, yPos);
        
        const dimensiones = await calcularDimensionesOptimas(graficas.mapa, 180, 130);
        doc.addImage(graficas.mapa, 'PNG', 15, yPos + 5, dimensiones.ancho, dimensiones.alto);
        
        // Leyenda
        yPos += dimensiones.alto + 12;
        doc.setFillColor(239, 68, 68);
        doc.circle(20, yPos - 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Pánico', 25, yPos);
        
        doc.setFillColor(16, 185, 129);
        doc.circle(60, yPos - 2, 2, 'F');
        doc.text('Médica', 65, yPos);
        
        if (options.signal?.aborted) throw new Error('AbortError');
      }
      
      // =====================================================
      // PÁGINA 3: GRÁFICA DE PASTEL Y BARRAS (ZONAS)
      // =====================================================
      if (graficas.pastel || graficas.barras) {
        doc.addPage();
        yPos = 20;
        
        doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('📊 ANÁLISIS POR TIPO Y ZONA', 15, 10);
        
        // Gráfica de pastel
        if (graficas.pastel && esImagenValida(graficas.pastel)) {
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Distribución por Tipo de Alerta', 15, yPos);
          
          const dimensiones = await calcularDimensionesOptimas(graficas.pastel, 80, 80);
          const xPos = (210 - dimensiones.ancho) / 2;
          doc.addImage(graficas.pastel, 'PNG', xPos, yPos + 3, dimensiones.ancho, dimensiones.alto);
          
          yPos += dimensiones.alto + 10;
        }
        
        // Gráfica de barras (zonas)
        if (graficas.barras && esImagenValida(graficas.barras)) {
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Incidentes por Zona', 15, yPos);
          
          const dimensiones = await calcularDimensionesOptimas(graficas.barras, 180, 80);
          doc.addImage(graficas.barras, 'PNG', 15, yPos + 3, dimensiones.ancho, dimensiones.alto);
          
          yPos += dimensiones.alto + 10;
        }
        
        if (options.signal?.aborted) throw new Error('AbortError');
      }
      
      // =====================================================
      // PÁGINA 4: ESTADOS, TENDENCIAS Y HORAS (NUEVAS GRÁFICAS)
      // =====================================================
      if (graficas.estados || graficas.tendencias || graficas.horas) {
        doc.addPage();
        yPos = 20;
        
        doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('📈 ANÁLISIS TEMPORAL Y DE ESTADOS', 15, 10);
        
        // ✅ NUEVA: Gráfica de Estados
        if (graficas.estados && esImagenValida(graficas.estados)) {
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Distribución por Estado', 15, yPos);
          
          const dimensiones = await calcularDimensionesOptimas(graficas.estados, 180, 60);
          doc.addImage(graficas.estados, 'PNG', 15, yPos + 3, dimensiones.ancho, dimensiones.alto);
          
          yPos += dimensiones.alto + 10;
        }
        
        // ✅ NUEVA: Gráfica de Tendencias Mensuales
        if (graficas.tendencias && esImagenValida(graficas.tendencias)) {
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Tendencias Mensuales (últimos 12 meses)', 15, yPos);
          
          const dimensiones = await calcularDimensionesOptimas(graficas.tendencias, 180, 60);
          doc.addImage(graficas.tendencias, 'PNG', 15, yPos + 3, dimensiones.ancho, dimensiones.alto);
          
          yPos += dimensiones.alto + 10;
        }
        
        // ✅ NUEVA: Gráfica de Horas del Día
        if (graficas.horas && esImagenValida(graficas.horas)) {
          // Si no hay espacio suficiente, agregar nueva página
          if (yPos > 200) {
            doc.addPage();
            yPos = 20;
            
            doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
            doc.rect(0, 0, 210, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('📈 ANÁLISIS TEMPORAL Y DE ESTADOS (CONTINUACIÓN)', 15, 10);
          }
          
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Alertas por Hora del Día', 15, yPos);
          
          const dimensiones = await calcularDimensionesOptimas(graficas.horas, 180, 60);
          doc.addImage(graficas.horas, 'PNG', 15, yPos + 3, dimensiones.ancho, dimensiones.alto);
        }
        
        if (options.signal?.aborted) throw new Error('AbortError');
      }
      
      // =====================================================
      // PÁGINA FINAL: TABLA DE DATOS POR ZONA
      // =====================================================
      if (graficas.datosPorZona && graficas.datosPorZona.length > 0) {
        doc.addPage();
        
        doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('📋 DETALLE DE INCIDENTES POR ZONA', 15, 10);
        
        const zonasParaMostrar = graficas.datosPorZona.slice(0, 50);
        
        const headers = [['Zona', 'Total', 'Pánico', 'Médica', '%', 'Activas', 'Proceso', 'Cerradas']];
        const dataRows = zonasParaMostrar.map(z => [
          z.zona,
          z.total.toString(),
          z.panico.toString(),
          z.medica.toString(),
          z.porcentaje ? `${z.porcentaje}%` : '0%',
          z.activas?.toString() || '0',
          z.enProceso?.toString() || '0',
          z.cerradas?.toString() || '0'
        ]);
        
        autoTable(doc, {
          startY: 25,
          head: headers,
          body: dataRows,
          theme: 'grid',
          headStyles: { fillColor: COLOR_PRIMARIO, textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 7 },
          margin: { left: 10, right: 10 }
        });
        
        if (graficas.datosPorZona.length > 50) {
          doc.setFontSize(6);
          doc.setTextColor(100, 100, 100);
          doc.text(`Nota: Solo se muestran las primeras 50 zonas de ${graficas.datosPorZona.length} totales.`, 15, doc.internal.pageSize.height - 15);
        }
      }
      
      // =====================================================
      // PIE DE PÁGINA EN TODAS LAS PÁGINAS
      // =====================================================
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Página ${i} de ${pageCount} • ${new Date().toLocaleDateString('es-MX')} • ${usuario?.nombre || 'Sistema'}`,
          15,
          doc.internal.pageSize.height - 8
        );
      }
      
      const fechaArchivo = new Date().toISOString().split('T')[0];
      doc.save(`Analisis_Geografico_${fechaArchivo}.pdf`);
      
      console.log('✅ PDF con gráficas generado correctamente');
      return true;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🛑 Generación de PDF cancelada');
        throw error;
      }
      console.error('❌ Error generando PDF con gráficas:', error);
      throw error;
    }
  }
}

export default new ReportesGraficasService();