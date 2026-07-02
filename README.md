# SOSER · Agregar Caso — v4

App web de registro de casos de mantención (SOSER). Guarda en Google Sheet vía Apps Script.

## Novedades v4
- **Botón Emergencia** (rojo, arriba): salta la selección de categoría y va directo a Indique + verificadores. En el Sheet queda como categoría "EMERGENCIA".
- **Subir desde galería**: además de cámara foto/video, botón "Galería" para elegir fotos/videos guardados en el teléfono.
- **Arreglo del bug de fotos**: la subida ahora **confirma** contra el servidor (CORS real). La barra de progreso muestra el avance y **Finalizar queda bloqueado** hasta que todos los verificadores estén 100% arriba. Si uno falla, avisa y no cierra el caso.
- **Cámara más robusta**: maneja permisos denegados, cámara ocupada, y falta de HTTPS con mensajes claros; si la cámara falla, siempre queda "Galería" como alternativa. Suelta bien la cámara al cerrar (arregla que no abriera en algunos equipos).
- **Video largo**: si supera 15s, avisa y ofrece **recorte tipo Movie Maker** (defines inicio/fin arrastrando, con previsualización). Nota: el recorte se hace en el navegador y en equipos de gama media puede ser lento; si falla, pide un video corto.
- **Eliminar caso**: ya no desaparece — baja al final, en gris y tachado, pero visible (igual en la lista y el chip). Pide motivo en un cuadro con fondo difuminado.
- **Reportes en 2 pestañas**: "Mis reportes" (los del encargado) y "General" (todos, con buscador de establecimientos que solo muestra los que tienen casos). Cada ticket tiene un botón **Verificadores** que abre un visor de fotos/videos con flechas para avanzar/retroceder y X o tocar fuera para cerrar.

## Archivos
- `index.html`, `app.js`, `data.js`, `.nojekyll` → app (GitHub Pages).
- `AppsScript_SOSER.gs` → backend del Sheet.

## IMPORTANTE: actualizar el Apps Script
Este `.gs` cambia la forma de responder (para confirmar las subidas). En tu Sheet: Extensiones ▸ Apps Script ▸ borra todo ▸ pega este ▸ `primeraVez` ▸ Implementar ▸ Gestionar implementaciones ▸ lápiz ▸ Nueva versión ▸ Implementar. Mantiene la misma URL /exec. La implementación debe tener acceso "Cualquier persona".

## Publicar
Sube los archivos a un repo ▸ Settings ▸ Pages ▸ main ▸ /(root). **Debe ser HTTPS** para cámara y GPS.
