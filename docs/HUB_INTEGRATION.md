# Integración completa de OnlyCars con NanoHub

Autorización del usuario: 25/10/2026, levantar la exclusión exclusivamente para
OnlyCars y su base. OnlyFood, OnlyPadel y OnlyERP no se modifican. La copia externa
del Hub sigue diferida por decisión del usuario; no se presenta como terminada.

## Punto de partida comprobado

Producción en `/opt/apps/onlycars`, rama master,
`a4f4b3a62377d62396cc5a1d9c3dbedf7bc773ad`. El checkout conserva nueve SQL
no rastreados; no se ejecutan, eliminan ni reemplazan. Imagen web inicial:
`sha256:acaf8894b8e14c6ba7cac521d94f0ab7db4342eaf00e4251ae4801412002634d`.
Compose efectivo `/opt/apps/onlycars/compose.npm.yaml`, servicios app y db.
MariaDB 11.8, base activa `onlycars`; `carshop_legacy_stage` se conserva intacta.
No se usan database-init, prisma db push ni seeds.

Inventario al 25/10: tres tenants, 168 clientes, 144 vehículos, 70 ventas,
31 préstamos, 478 cuotas de préstamo y 505 cuotas de venta. Fotografías y documentos
usan R2, prefijo onlycars; credenciales, bucket, URLs e IDs se conservan. No se
copia, renombra ni elimina contenido del bucket compartido de otros productos.

Backup previo real: 767821 bytes comprimidos, SHA-256
`cf8723885b1ffe0d93e4adc15849df75396c58105257d9691f6ab7fb51566f2e`.
Restaurado en MariaDB temporal sin red ni volúmenes productivos: 44 tablas,
2983 filas y 79 FKs comprobadas; incluye el esquema histórico. La aplicación
productiva continuó en funcionamiento. Copia retenida en servidor y PC privada.

## Alcance y aceptación

- Lectura paginada de tenants para Governance, sin clientes ni datos de negocio.
- Catálogo autenticado y firmado; todas las lecturas son puras. No se llaman los
  getters nativos que sincronizan vencimientos mediante escrituras.
- Gestión de identidad y contactos del tenant, estados, planes y límites,
  suscripciones y renovación, módulos efectivos, administradores y sesiones,
  pagos SaaS, dominios y auditoría. Ventas del negocio no se mezclan con pagos SaaS.
- Idempotencia persistida, validación de versiones, transacciones y auditoría con
  actor individual. Tokens independientes por función, HMAC, límites de cuerpo,
  rechazo de credenciales de otros productos y de firmas vencidas.
- Preservar cuentas compartidas: no cambiar identidad ni revocar sesiones de
  usuarios que pertenecen a otro tenant o tienen rol de plataforma desde una ficha.
- Catálogo de módulos limitado a capacidades realmente ejecutadas por la app:
  `pwa_clientes`, `seller_pwa` y `branding_documentos`. Las características
  históricas del plan no presentadas como switches se conservan al editarlo.
- Mantener Superadmin y rutas actuales mientras se acredita paridad de funciones.
  No redirigir ni retirar pantallas nativas durante esta integración.

## Cambios y despliegue previstos

Se requieren controles persistidos para que las excepciones e herencia de módulos
no borren las configuraciones actuales y no puedan ser reactivadas por un formulario
de tenant cuando estén bloqueadas desde plataforma. Se preparan columnas booleanas
aditivas con valor false: Plan.hubManaged, TenantFeature.hubManaged y
TenantFeature.hubInherit. Se prueba la ampliación primero en el clon restaurado.
No se usa db push ni se altera el resto del esquema. Un rollback de la imagen
conserva estas columnas; no se elimina información para revertir.

Antes de producción: backup fresco y restore, CI del commit exacto, imagen sin
secretos, Compose efectivo privado preservado, inventario de vecinos actualizado
y compatibilidad de almacenamiento y sesiones. Desplegar únicamente app con
--no-deps y la imagen fijada, sin reconstruir/recrear db ni inicializadores.

El Hub necesita autorización específica de OnlyCars en su conector, UI y backups;
se preserva la protección de OnlyPadel y OnlyERP. Sólo se habilita OnlyCars una vez
probados sus contratos. La actualización del Hub sigue su worker de releases.

## Pruebas requeridas

Clon restaurado en red Docker privada, sin credenciales R2 ni acceso a servicios
productivos. Fixtures identificables sólo dentro de ese clon. Probar cada lectura
y comando, duplicados/concurrencia, versiones viejas, errores de validación,
aislamiento entre dos tenants, cuentas compartidas, expiración, módulos y
configuraciones bloqueadas, moneda y períodos de pago, dominios y sesiones.
UI del Hub en escritorio/móvil para OnlyCars y regresión de productos existentes.
Login/Superadmin/portal de OnlyCars con fixtures; funcionalidades y datos existentes
no se prueban escribiendo sobre tenants reales.

Después del despliegue: salud, HTTPS, lectura de capacidades y conteos, integridad
del backup, ausencia de cambios de IDs y relaciones salvo los comandos autorizados,
configuración/archivos conservados y vecinos intactos. El informe final registrará
la evidencia y lo que no se haya podido comprobar; este plan no acredita ejecución.
