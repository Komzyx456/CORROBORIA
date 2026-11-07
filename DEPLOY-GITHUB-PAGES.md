# Publicar LumIA en GitHub Pages

Esta guía permite obtener un enlace público sin contratar hosting. GitHub Pages publica archivos estáticos como HTML, CSS y JavaScript.

## 1. Crear un repositorio
1. Entra en https://github.com/ e inicia sesión o crea una cuenta.
2. Pulsa **New repository**.
3. Ponle un nombre, por ejemplo `lumia-corroboraai`.
4. Para GitHub Pages gratuito, selecciona **Public**. Recuerda que el código será visible para otras personas.
5. Pulsa **Create repository**.

## 2. Subir los archivos
1. Descomprime `LumIA-final.zip`.
2. Abre el repositorio recién creado en GitHub.
3. Selecciona **Add file > Upload files**.
4. Arrastra el CONTENIDO de la carpeta `LumIA-final` (no la carpeta contenedora): `index.html`, `styles.css`, `script.js`, `lumi.png`, `manifest.json`, `service-worker.js`, `icons/`, `LEEME.txt` y este archivo.
5. Pulsa **Commit changes**.

## 3. Activar GitHub Pages
1. En el repositorio, abre **Settings > Pages**.
2. En **Build and deployment**, elige **Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta `/(root)`.
4. Pulsa **Save**.
5. Espera a que termine la publicación. En esa misma sección aparecerá la dirección del sitio, normalmente `https://TU-USUARIO.github.io/lumia-corroboraai/`.

## 4. Probar e instalar
1. Abre el enlace público.
2. Prueba primero el menú, evaluador, semáforo y selector de temas.
3. Abre el enlace en el celular. En iPhone usa Safari > Compartir > Añadir a pantalla de inicio. En Android, abre el menú de Chrome y elige Instalar aplicación o Añadir a pantalla de inicio.
4. Visita la web una vez con internet para que el service worker guarde los archivos principales.

## Si haces cambios
Edita los archivos en VS Code, vuelve a subir los archivos modificados al repositorio y espera a que GitHub Pages actualice el sitio. Si el navegador muestra una versión anterior, recarga la página o cierra y vuelve a abrir la pestaña.

## Límites del prototipo
El evaluador es local y basado en reglas; no consulta un modelo de IA. El feedback no se envía a ningún destino. La foto de portada y Google Fonts son recursos externos y no están disponibles sin conexión.
