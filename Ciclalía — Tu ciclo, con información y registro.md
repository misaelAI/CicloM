# Ciclalía — Tu ciclo, con información y registro

Sitio web educativo en español sobre el ciclo menstrual, con un calendario para registrar periodos y síntomas, un resumen imprimible para una consulta y una estimación orientativa del embarazo. La aplicación no tiene cuenta ni backend: los registros se guardan en el `localStorage` del navegador que se utiliza.

## Estructura

- `index.html`: contenido, navegación, calendario, formularios y fuentes de salud.
- `styles.css`: diseño adaptable a móvil y escritorio, accesibilidad y estilos de impresión.
- `app.js`: calendario, cálculos estimados, registro local de síntomas y resumen imprimible.
- `server.js`: servidor estático Node.js sin dependencias externas.
- `package.json`: comandos de ejecución y revisión de sintaxis.
- `manus-routes.json`: declaración de la ruta del sitio para la plataforma Manus.
- `favicon.svg`: icono de Ciclalía.
- `app.config.ts`: metadata de logotipo de la plataforma Manus.
- `TODO.md`: criterios del proyecto.

## Ejecutar

Requiere Node.js 18 o superior. Desde la carpeta del proyecto:

```bash
npm start
```

El sitio escucha en el puerto `3000`. Abre `http://localhost:3000`. Para usar otro puerto:

```bash
PORT=8080 npm start
```

Para comprobar la sintaxis del JavaScript del servidor y de la aplicación:

```bash
npm run check
```

No hacen falta dependencias adicionales ni variables secretas.

## Copiar a GitHub

1. Crea un repositorio vacío en GitHub.
2. Descarga y descomprime el archivo ZIP del proyecto, o copia los archivos fuente individuales.
3. Abre una terminal dentro de la carpeta y ejecuta:

```bash
git init
git add .
git commit -m "Añade Ciclalía, calendario y recursos de salud menstrual"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

Reemplaza `TU-USUARIO/TU-REPOSITORIO` por la dirección de tu repositorio. Nunca incluyas contraseñas o tokens de GitHub en los archivos del sitio.

## Ilustraciones

Las ilustraciones generadas están referenciadas desde las rutas `/manus-storage/async-images/...` de Manus en `index.html`; en el preview de Manus la plataforma administra esas imágenes. Al alojar este código fuera de Manus, descarga las imágenes desde el proyecto y actualiza las rutas `src` de `index.html` a los nombres de archivos que hayas guardado, por ejemplo `/images/hero.webp`. El código fuente no contiene datos personales ni analítica.

## Privacidad y salud

- Las fechas y síntomas se guardan en el almacenamiento local del navegador; borrar esos datos del navegador o cambiar de dispositivo/navegador los elimina o hace que no aparezcan.
- La fecha de la próxima menstruación se presenta como estimación basada en el ciclo que ingresa la persona, no como certeza.
- La herramienta no predice ni confirma la ovulación, no confirma un embarazo, no es anticonceptivo ni sustituye orientación médica.
- El cálculo del embarazo basado en la última menstruación es aproximado y debe confirmarse con atención prenatal.

Consulta los enlaces de organismos internacionales, regionales y nacionales que aparecen al final de la página. En la solicitud original no se indicó el país de publicación, por eso se incluyen referencias nacionales de México, Chile y Colombia, junto a fuentes mundiales y latinoamericanas.
