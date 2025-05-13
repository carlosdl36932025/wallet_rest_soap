Ejecutar:

1) Ejecutar en mysql el archivo que se encuentra en la carpeta src/sql/setup.sql
2) crear un archivo .env en la raiz del proyecto
3) agregar las siguientes variables de entorno:
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=password_aqui
    DB_NAME=wallet_db
4) npm install
5) npm run start

6) En el codigo en emailService.js se encuentra la configuracion de email, por default se utiliza el servicio de mailtrap, para probar el envio de emails, se puede utilizar el servicio de mailtrap o cualquier otro servicio de email.
Al estar en local , mailtrap solo permite envios a si mismo por ende para visualizar el token es necesario copiar el token de la consola o desde el registro de la base de datos.

Puede probarse el servidor soap en POSTMAN
se adjunta enlace demo de como estructurar las peticiones : https://www.postman.com/carloseduardodominguezleyva/api-soap/request/1dlq15v/create-client?tab=body
