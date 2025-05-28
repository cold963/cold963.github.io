document.addEventListener("DOMContentLoaded", function() {
  console.log("Configuración a verificar:", {
    user_id: 'Kyo64dCQkTDFSVPzL',
    service_id: 'service_ohtcnzk',
    template_id: 'template_6or73b6'
  });

  // 1. Inicialización de EmailJS
  emailjs.init('Kyo64dCQkTDFSVPzL').then(() => {
    console.log('EmailJS inicializado correctamente');
  }).catch(error => {
    console.error('Error al inicializar EmailJS:', error);
    alert('Error al configurar el servicio de correo. Recarga la página.');
  });

  // 2. Obtener formulario
  const form = document.getElementById('miFormulario');
  if (!form) {
    console.error('No se encontró el formulario');
    return;
  }

  

  // 3. Configurar checkboxes para selección única por fila
  function configurarCheckboxes() {
    document.querySelectorAll("table tbody tr").forEach(row => {
      const checkboxes = row.querySelectorAll("input[type='checkbox']");
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
          if (this.checked) {
            checkboxes.forEach(cb => {
              if (cb !== this) cb.checked = false;
            });
          }
        });
      });
    });
  }

  // 4. Función para convertir blob a base64
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // 5. Función para generar PDF con todos los datos del formulario
  async function generarPDFCompleto(formData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración del documento
    doc.setFont("helvetica");
    doc.setFontSize(16);
    doc.text("LISTA DE CHEQUEO VEHICULAR - ALCALDÍA DE YOPAL", 105, 15, { align: 'center' });
    
    let y = 25;
    
    // Función para agregar secciones
    const agregarSeccion = (titulo, campos) => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(titulo.toUpperCase(), 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      
      campos.forEach(campo => {
        const valor = formData.get(campo) || 'N/A';
        doc.text(`${campo.replace(/_/g, ' ').toUpperCase()}: ${valor}`, 20, y);
        y += 7;
      });
      
      return y + 5;
    };
    
    // Sección 1: Datos Generales
    y = agregarSeccion("Datos Generales", [
      'email', 'placa', 'modelo', 'tipo_vehiculo', 'FECHA_DE_REALIZACIÓN_DE_INSPECCIÓN'
    ]);
    
    // Sección 2: Datos del Conductor
    y = agregarSeccion("Datos del Conductor", [
      'nombre', 'cedula', 'eps', 'FECHA_DE_NACIMIENTO', 'FECHA_DE_VENCIMIENTO_DE_LA_LICENCIA_DE_CONDUCCIÓN'
    ]);
    
    // Sección 3: Documentos del Vehículo
    y = agregarSeccion("Documentos del Vehículo", [
      'FECHA_DE_VENCIMIENTO TECNICOMECÁNICA', 'FECHA_DE_VENCIMIENTO_DEL_SOAT', 'FECHA_DE_VENCIMIENTO_DE_LA_PÓLIZA_DE_SEGURO', 'KILOMETRAJE', 'FECHA_DE_ÚLTIMO_CAMBIO_DE_ACEITE'
    ]);
    
    // Sección 4: Lista de Chequeo (resumen)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN DE CHEQUEO", 20, y);
    y += 10;
    
    // Procesar todas las tablas de chequeo
    const categorias = [
      'EXTERIOR DEL VEHICULO',
      'INTERIOR DEL VEHICULO', 
      'EQUIPO DE CARRETERA',
      'CONDICIONES MECÁNICAS',
      'CONDICIONES ELÉCTRICAS'
    ];
    
    for (const categoria of categorias) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`>> ${categoria}`, 20, y);
      y += 7;
      
      // Simular contenido de chequeo (puedes personalizar esto)
      doc.setFont("helvetica", "normal");
      doc.text("Verificado: Sí/No - Observaciones: Ninguna", 25, y);
      y += 7;
    }
    
    // Sección 5: Observaciones
    if (formData.get('observaciones')) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("OBSERVACIONES:", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      const obsLines = doc.splitTextToSize(formData.get('observaciones'), 170);
      obsLines.forEach(line => {
        doc.text(line, 20, y);
        y += 7;
      });
    }
    
    // Pie de página
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Generado automáticamente por el Sistema de Chequeo Vehicular", 105, 285, { align: 'center' });
    
    return doc;
  }

  // 6. Manejo del envío del formulario
  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    try {
      // Validación básica
      if (!formData.get('email') || !formData.get('placa') || !formData.get('modelo')) {
        throw new Error('Por favor complete los campos requeridos');
      }
      
      // Mostrar estado de carga
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";
      
      // Generar PDF completo
      const pdfDoc = await generarPDFCompleto(formData);
      const pdfBlob = pdfDoc.output('blob');
      
      // Preparar datos para EmailJS
      const templateParams = {
        to_email: formData.get('email'),
        to_name: formData.get('nombre'),
        placa: formData.get('placa'),
        modelo: formData.get('modelo'),
        fecha_inspeccion: formData.get('FECHA_DE_REALIZACIÓN_DE_INSPECCIÓN'),
        observaciones: formData.get('observaciones') || 'Ninguna',
        pdf_attachment: await blobToBase64(pdfBlob),
        pdf_name: `chequeo_vehicular_${formData.get('placa')}.pdf`
      };
      
      console.log("Enviando datos:", templateParams);
      
      // Enviar con EmailJS
      const response = await emailjs.send(
        'service_ohtcnzk',
        'template_6or73b6',
        templateParams
      );
      
      console.log("Respuesta de EmailJS:", response);
      
      // Verificar respuesta
      if (response.status === 200) {
        // Descargar PDF localmente
        pdfDoc.save(`chequeo_${formData.get('placa')}.pdf`);
        alert('✅ Formulario enviado correctamente. Revise su correo electrónico.');
        form.reset();
      } else {
        throw new Error(response.text || "Error al enviar el correo");
      }
      
    } catch (error) {
      console.error("Error completo:", error);
      alert(`❌ Error: ${error.message || "Por favor intente nuevamente"}`);
      
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar Formulario";
    }
  });

  // Inicializar checkboxes
  configurarCheckboxes();
})
