import { PrismaClient, EstadoVehiculo, FormaPago, EstadoSolicitudPrestamo } from '@prisma/client';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);
const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

async function main() {
  console.log('--- 🚀 Iniciando Seed Completo para Tenant "testcars" ---');

  // 1. Asegurar Plan PRO
  let plan = await prisma.plan.findUnique({ where: { code: 'PRO' } });
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        code: 'PRO',
        name: 'Plan Profesional',
        priceMonthly: 249,
        maxVehicles: 150,
        maxLocations: 3,
        maxUsers: 10,
        features: ['crm_leads', 'multi_location', 'trade_ins', 'print_contracts', 'advanced_costing'],
      },
    });
  }

  // 2. Tenant "testcars"
  console.log('1. Creando o actualizando Tenant "testcars"...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'testcars' },
    update: {
      name: 'TestCars Motors',
      status: 'ACTIVE',
      email: 'contacto@testcars.com.ar',
      phone: '+54 9 341 555-0199',
      address: 'Av. Pellegrini 2450',
      city: 'Rosario',
      cuit: '30-71998877-3',
    },
    create: {
      id: 'tenant_testcars',
      slug: 'testcars',
      name: 'TestCars Motors',
      status: 'ACTIVE',
      email: 'contacto@testcars.com.ar',
      phone: '+54 9 341 555-0199',
      address: 'Av. Pellegrini 2450',
      city: 'Rosario',
      cuit: '30-71998877-3',
    },
  });

  // 3. Dominios
  console.log('2. Vinculando dominios...');
  const baseDomain = process.env.BASE_DOMAIN || 'onlycars.nanoapps.ar';
  const domains = [
    { hostname: `testcars.${baseDomain}`, isPrimary: true },
    { hostname: 'testcars.nanoapps.ar', isPrimary: false },
    { hostname: 'testcars.localhost', isPrimary: false },
  ];

  for (const d of domains) {
    await prisma.tenantDomain.upsert({
      where: { hostname: d.hostname },
      update: { tenantId: tenant.id, isPrimary: d.isPrimary },
      create: { tenantId: tenant.id, hostname: d.hostname, isPrimary: d.isPrimary },
    });
  }

  // 4. Suscripción y Sucursal
  const periodEnd = new Date();
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: { planId: plan.id, status: 'ACTIVE', currentPeriodEnd: periodEnd },
    create: {
      tenantId: tenant.id,
      planId: plan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    },
  });

  const location = await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'central' } },
    update: { name: 'Casa Central Rosario', isActive: true },
    create: {
      id: 'loc_testcars_central',
      tenantId: tenant.id,
      code: 'central',
      name: 'Casa Central Rosario',
      address: 'Av. Pellegrini 2450',
      city: 'Rosario',
      phone: '+54 9 341 555-0199',
      isActive: true,
    },
  });

  // 5. Configuración de Tenant y Módulos (pwa_clientes activo y configurable)
  console.log('3. Habilitando módulo pwa_clientes y configuraciones...');
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: { dolarActual: 1400 },
    create: { tenantId: tenant.id, dolarActual: 1400 },
  });

  await prisma.tenantFeature.upsert({
    where: {
      tenantId_featureKey: { tenantId: tenant.id, featureKey: 'pwa_clientes' },
    },
    update: {
      enabled: true,
      config: {
        enabled: true,
        mostrarCuotas: true,
        mostrarPrestamos: true,
        mostrarCatalogo: true,
        permitirSolicitudPrestamo: true,
        whatsappContacto: '+54 9 341 555-0199',
        mensajeBienvenida: '¡Bienvenido a TestCars Motors! Consultá tus cuotas, préstamos y unidades disponibles online.',
      },
    },
    create: {
      tenantId: tenant.id,
      featureKey: 'pwa_clientes',
      enabled: true,
      config: {
        enabled: true,
        mostrarCuotas: true,
        mostrarPrestamos: true,
        mostrarCatalogo: true,
        permitirSolicitudPrestamo: true,
        whatsappContacto: '+54 9 341 555-0199',
        mensajeBienvenida: '¡Bienvenido a TestCars Motors! Consultá tus cuotas, préstamos y unidades disponibles online.',
      },
    },
  });

  await prisma.tenantFeature.upsert({
    where: {
      tenantId_featureKey: { tenantId: tenant.id, featureKey: 'seller_pwa' },
    },
    update: { enabled: true },
    create: { tenantId: tenant.id, featureKey: 'seller_pwa', enabled: true },
  });

  // 6. Usuario Administrador de TestCars
  console.log('4. Creando usuario administrador de la agencia...');
  const adminEmail = 'admin@testcars.com.ar';
  const adminPassHash = await hashPassword('TestCars2026!');
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: 'Administrador TestCars', passwordHash: adminPassHash },
    create: {
      email: adminEmail,
      name: 'Administrador TestCars',
      passwordHash: adminPassHash,
      isSuperAdmin: false,
    },
  });

  await prisma.tenantMembership.upsert({
    where: {
      userId_tenantId: { userId: adminUser.id, tenantId: tenant.id },
    },
    update: { role: 'OWNER', isActive: true },
    create: {
      userId: adminUser.id,
      tenantId: tenant.id,
      role: 'OWNER',
      isActive: true,
    },
  });

  // 7. Clientes (con claves pre-seteadas para probar PWA y reseteos)
  console.log('5. Creando clientes...');
  const clientePassHash = await hashPassword('123456');

  // Cliente 1: Juan Carlos Pérez (Tiene plan de cuotas y préstamo de dinero)
  const clienteJuan = await prisma.cliente.upsert({
    where: { tenantId_dni: { tenantId: tenant.id, dni: '32111222' } },
    update: {
      nombre_completo: 'Juan Carlos Pérez',
      telefono: '+54 9 341 555-1122',
      email: 'juan.perez@gmail.com',
      passwordHash: clientePassHash,
      domicilio: 'Bv. Oroño 1234',
      localidad: 'Rosario',
      provincia: 'Santa Fe',
    },
    create: {
      tenantId: tenant.id,
      dni: '32111222',
      nombre_completo: 'Juan Carlos Pérez',
      telefono: '+54 9 341 555-1122',
      email: 'juan.perez@gmail.com',
      passwordHash: clientePassHash,
      domicilio: 'Bv. Oroño 1234',
      localidad: 'Rosario',
      provincia: 'Santa Fe',
    },
  });

  // Cliente 2: Mariana Gómez (Tiene plan de cuotas de moto y solicitud de préstamo)
  const clienteMariana = await prisma.cliente.upsert({
    where: { tenantId_dni: { tenantId: tenant.id, dni: '35222333' } },
    update: {
      nombre_completo: 'Mariana Gómez',
      telefono: '+54 9 341 555-3344',
      email: 'mariana.gomez@hotmail.com',
      passwordHash: clientePassHash,
      domicilio: 'San Martín 850',
      localidad: 'Rosario',
      provincia: 'Santa Fe',
    },
    create: {
      tenantId: tenant.id,
      dni: '35222333',
      nombre_completo: 'Mariana Gómez',
      telefono: '+54 9 341 555-3344',
      email: 'mariana.gomez@hotmail.com',
      passwordHash: clientePassHash,
      domicilio: 'San Martín 850',
      localidad: 'Rosario',
      provincia: 'Santa Fe',
    },
  });

  // Cliente 3: Roberto Díaz (Tiene solicitud de préstamo en revisión)
  const clienteRoberto = await prisma.cliente.upsert({
    where: { tenantId_dni: { tenantId: tenant.id, dni: '28333444' } },
    update: {
      nombre_completo: 'Roberto Díaz',
      telefono: '+54 9 341 555-7788',
      email: 'roberto.diaz@yahoo.com',
      passwordHash: clientePassHash,
      domicilio: 'Cordoba 2100',
      localidad: 'Rosario',
      provincia: 'Santa Fe',
    },
    create: {
      tenantId: tenant.id,
      dni: '28333444',
      nombre_completo: 'Roberto Díaz',
      telefono: '+54 9 341 555-7788',
      email: 'roberto.diaz@yahoo.com',
      passwordHash: clientePassHash,
      domicilio: 'Cordoba 2100',
      localidad: 'Rosario',
      provincia: 'Santa Fe',
    },
  });

  // Cliente 4: Florencia Rossi (Sin clave creada para probar primer login / reset)
  const clienteFlorencia = await prisma.cliente.upsert({
    where: { tenantId_dni: { tenantId: tenant.id, dni: '40444555' } },
    update: {
      nombre_completo: 'Florencia Rossi',
      telefono: '+54 9 341 555-9900',
      email: 'florencia.rossi@gmail.com',
      domicilio: 'Salta 1520',
      localidad: 'Rosario',
      provincia: 'Santa Fe',
    },
    create: {
      tenantId: tenant.id,
      dni: '40444555',
      nombre_completo: 'Florencia Rossi',
      telefono: '+54 9 341 555-9900',
      email: 'florencia.rossi@gmail.com',
      domicilio: 'Salta 1520',
      localidad: 'Rosario',
      provincia: 'Santa Fe',
    },
  });

  // 8. Vehículos y Motos (Con publicadosWeb true/false)
  console.log('6. Creando inventario de vehículos y motos...');

  // Auto 1: Toyota Hilux 2022 (Vendido a Juan con saldo financiado)
  const autoHilux = await prisma.vehiculo.upsert({
    where: { tenantId_patente: { tenantId: tenant.id, patente: 'AF123TC' } },
    update: { publicadoWeb: true, estado: EstadoVehiculo.VENDIDO },
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      tipo_vehiculo: 'Auto',
      marca: 'Toyota',
      modelo: 'Hilux SRX 2.8 4x4',
      anio: 2022,
      km: 45000,
      patente: 'AF123TC',
      combustible: 'Diesel',
      transmision: 'Automática',
      color: 'Blanco Perlado',
      estado: EstadoVehiculo.VENDIDO,
      precio_compra_usd: 28000,
      precio_venta_usd: 35000,
      publicadoWeb: true,
      fotos: {
        create: [
          {
            tenantId: tenant.id,
            url_foto: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=1000&q=80',
            orden: 0,
          },
        ],
      },
    },
  });

  // Auto 2: Volkswagen Amarok V6 2023 (Listo para venta, PUBLICADO ONLINE)
  await prisma.vehiculo.upsert({
    where: { tenantId_patente: { tenantId: tenant.id, patente: 'AG456TC' } },
    update: { publicadoWeb: true, estado: EstadoVehiculo.LISTO_PARA_VENTA },
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      tipo_vehiculo: 'Auto',
      marca: 'Volkswagen',
      modelo: 'Amarok V6 Extreme 4Motion',
      anio: 2023,
      km: 22000,
      patente: 'AG456TC',
      combustible: 'Diesel',
      transmision: 'Automática',
      color: 'Gris Indium',
      estado: EstadoVehiculo.LISTO_PARA_VENTA,
      precio_compra_usd: 34000,
      precio_venta_usd: 42000,
      publicadoWeb: true,
      fotos: {
        create: [
          {
            tenantId: tenant.id,
            url_foto: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&q=80',
            orden: 0,
          },
        ],
      },
    },
  });

  // Auto 3: Peugeot 208 Feline 2022 (Consignación, PUBLICADO ONLINE)
  await prisma.vehiculo.upsert({
    where: { tenantId_patente: { tenantId: tenant.id, patente: 'AF789TC' } },
    update: { publicadoWeb: true, estado: EstadoVehiculo.EN_CONSIGNACION },
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      tipo_vehiculo: 'Auto',
      marca: 'Peugeot',
      modelo: '208 1.6 Feline Tiptronic',
      anio: 2022,
      km: 31000,
      patente: 'AF789TC',
      combustible: 'Nafta',
      transmision: 'Automática',
      color: 'Azul Quasar',
      tipo_ingreso: 'Consignacion',
      comision_consignacion_pct: 4,
      estado: EstadoVehiculo.EN_CONSIGNACION,
      precio_venta_usd: 17500,
      publicadoWeb: true,
      fotos: {
        create: [
          {
            tenantId: tenant.id,
            url_foto: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&q=80',
            orden: 0,
          },
        ],
      },
    },
  });

  // Auto 4: Chevrolet Cruze Premier 2020 (Listo para venta, NO PUBLICADO WEB / OCULTO)
  await prisma.vehiculo.upsert({
    where: { tenantId_patente: { tenantId: tenant.id, patente: 'AE999TC' } },
    update: { publicadoWeb: false, estado: EstadoVehiculo.LISTO_PARA_VENTA },
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      tipo_vehiculo: 'Auto',
      marca: 'Chevrolet',
      modelo: 'Cruze 1.4T Premier Sedan',
      anio: 2020,
      km: 58000,
      patente: 'AE999TC',
      combustible: 'Nafta',
      transmision: 'Automática',
      color: 'Gris Satin Steel',
      estado: EstadoVehiculo.LISTO_PARA_VENTA,
      precio_compra_usd: 13500,
      precio_venta_usd: 16800,
      publicadoWeb: false, // <-- IMPORTANTE: OCULTO DEL CATÁLOGO
      fotos: {
        create: [
          {
            tenantId: tenant.id,
            url_foto: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&q=80',
            orden: 0,
          },
        ],
      },
    },
  });

  // Moto 1: Honda XR 250 Tornado 2023 (Vendida a Mariana con cuotas)
  const motoTornado = await prisma.vehiculo.upsert({
    where: { tenantId_patente: { tenantId: tenant.id, patente: 'A123TCB' } },
    update: { publicadoWeb: true, estado: EstadoVehiculo.VENDIDO },
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      tipo_vehiculo: 'Moto',
      marca: 'Honda',
      modelo: 'XR 250 Tornado',
      cilindrada: '250cc',
      anio: 2023,
      km: 8500,
      patente: 'A123TCB',
      combustible: 'Nafta',
      transmision: 'Manual',
      color: 'Rojo / Blanco',
      estado: EstadoVehiculo.VENDIDO,
      precio_compra_usd: 3500,
      precio_venta_usd: 4800,
      publicadoWeb: true,
      fotos: {
        create: [
          {
            tenantId: tenant.id,
            url_foto: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1000&q=80',
            orden: 0,
          },
        ],
      },
    },
  });

  // Moto 2: Yamaha MT-03 2022 (Lista para venta, PUBLICADA ONLINE)
  await prisma.vehiculo.upsert({
    where: { tenantId_patente: { tenantId: tenant.id, patente: 'A456TCM' } },
    update: { publicadoWeb: true, estado: EstadoVehiculo.LISTO_PARA_VENTA },
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      tipo_vehiculo: 'Moto',
      marca: 'Yamaha',
      modelo: 'MT-03 ABS',
      cilindrada: '321cc',
      anio: 2022,
      km: 11000,
      patente: 'A456TCM',
      combustible: 'Nafta',
      transmision: 'Manual',
      color: 'Negro Midnight',
      estado: EstadoVehiculo.LISTO_PARA_VENTA,
      precio_compra_usd: 5400,
      precio_venta_usd: 6900,
      publicadoWeb: true,
      fotos: {
        create: [
          {
            tenantId: tenant.id,
            url_foto: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1000&q=80',
            orden: 0,
          },
        ],
      },
    },
  });

  // Moto 3: Kawasaki Versys-X 300 2023 (Lista para venta, PUBLICADA ONLINE)
  await prisma.vehiculo.upsert({
    where: { tenantId_patente: { tenantId: tenant.id, patente: 'A789TCK' } },
    update: { publicadoWeb: true, estado: EstadoVehiculo.LISTO_PARA_VENTA },
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      tipo_vehiculo: 'Moto',
      marca: 'Kawasaki',
      modelo: 'Versys-X 300 ABS',
      cilindrada: '296cc',
      anio: 2023,
      km: 6200,
      patente: 'A789TCK',
      combustible: 'Nafta',
      transmision: 'Manual',
      color: 'Verde Lima',
      estado: EstadoVehiculo.LISTO_PARA_VENTA,
      precio_compra_usd: 7200,
      precio_venta_usd: 8800,
      publicadoWeb: true,
      fotos: {
        create: [
          {
            tenantId: tenant.id,
            url_foto: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1000&q=80',
            orden: 0,
          },
        ],
      },
    },
  });

  // 9. Ventas con Cuotas
  console.log('7. Creando ventas y planes de cuotas...');

  // Venta 1: Juan Carlos Pérez compra la Hilux (12 cuotas de USD 1,000)
  const existingVentaJuan = await prisma.venta.findFirst({
    where: { tenantId: tenant.id, id_cliente: clienteJuan.id_cliente, id_vehiculo: autoHilux.id_vehiculo },
  });

  let idVentaJuan;
  if (!existingVentaJuan) {
    const v1 = await prisma.venta.create({
      data: {
        tenantId: tenant.id,
        locationId: location.id,
        id_vehiculo: autoHilux.id_vehiculo,
        id_cliente: clienteJuan.id_cliente,
        vendedorId: adminUser.id,
        precio_final_usd: 35000,
        forma_pago: FormaPago.Financiado,
        cotizacion_dolar_venta: 1400,
        anticipo_usd: 23000,
        saldo_financiado_usd: 12000,
        numero_boleto: 'BOL-2026-001',
        observaciones: 'Financiación directa en 12 cuotas fijas de USD 1.000.',
      },
    });
    idVentaJuan = v1.id_venta;

    // Crear 12 cuotas: 5 PAGADAS, 7 PENDIENTES
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const vDate = new Date(now);
      vDate.setMonth(vDate.getMonth() - 5 + i);

      const isPaid = i <= 5;
      const pDate = new Date(vDate);
      pDate.setDate(pDate.getDate() - 2);

      await prisma.ventaCuota.create({
        data: {
          tenantId: tenant.id,
          id_venta: idVentaJuan,
          numero_cuota: i,
          monto_usd: 1000,
          fecha_vencimiento: vDate,
          estado: isPaid ? 'PAGADA' : 'PENDIENTE',
          monto_pagado_ars: isPaid ? 1400000 : null,
          cotizacion_pago: isPaid ? 1400 : null,
          fecha_pago: isPaid ? pDate : null,
          recibo_nro: isPaid ? `REC-TC-${1000 + i}` : null,
        },
      });
    }
  }

  // Venta 2: Mariana Gómez compra la Tornado (6 cuotas de USD 400)
  const existingVentaMariana = await prisma.venta.findFirst({
    where: { tenantId: tenant.id, id_cliente: clienteMariana.id_cliente, id_vehiculo: motoTornado.id_vehiculo },
  });

  if (!existingVentaMariana) {
    const v2 = await prisma.venta.create({
      data: {
        tenantId: tenant.id,
        locationId: location.id,
        id_vehiculo: motoTornado.id_vehiculo,
        id_cliente: clienteMariana.id_cliente,
        vendedorId: adminUser.id,
        precio_final_usd: 4800,
        forma_pago: FormaPago.Financiado,
        cotizacion_dolar_venta: 1400,
        anticipo_usd: 2400,
        saldo_financiado_usd: 2400,
        numero_boleto: 'BOL-2026-002',
        observaciones: 'Venta de moto financiada en 6 cuotas de USD 400.',
      },
    });

    const now = new Date();
    for (let i = 1; i <= 6; i++) {
      const vDate = new Date(now);
      vDate.setMonth(vDate.getMonth() - 3 + i);

      const isPaid = i <= 3;
      await prisma.ventaCuota.create({
        data: {
          tenantId: tenant.id,
          id_venta: v2.id_venta,
          numero_cuota: i,
          monto_usd: 400,
          fecha_vencimiento: vDate,
          estado: isPaid ? 'PAGADA' : 'PENDIENTE',
          monto_pagado_ars: isPaid ? 560000 : null,
          cotizacion_pago: isPaid ? 1400 : null,
          fecha_pago: isPaid ? vDate : null,
          recibo_nro: isPaid ? `REC-TCM-${2000 + i}` : null,
        },
      });
    }
  }

  // 10. Préstamo de Dinero en Efectivo (Para Juan Carlos Pérez)
  console.log('8. Creando préstamos de dinero y cuotas...');
  const existingPrestamo = await prisma.prestamo.findFirst({
    where: { tenantId: tenant.id, id_cliente: clienteJuan.id_cliente },
  });

  if (!existingPrestamo) {
    const p1 = await prisma.prestamo.create({
      data: {
        tenantId: tenant.id,
        id_cliente: clienteJuan.id_cliente,
        capital_entregado_usd: 3000,
        total_devolver_usd: 3600,
        cotizacion_dolar_prestamo: 1400,
        estado: 'ACTIVO',
      },
    });

    const now = new Date();
    for (let i = 1; i <= 6; i++) {
      const vDate = new Date(now);
      vDate.setMonth(vDate.getMonth() - 2 + i);

      const isPaid = i <= 2;
      await prisma.prestamoCuota.create({
        data: {
          tenantId: tenant.id,
          id_prestamo: p1.id_prestamo,
          numero_cuota: i,
          monto_usd: 600,
          fecha_vencimiento: vDate,
          estado: isPaid ? 'PAGADA' : 'PENDIENTE',
          monto_pagado_ars: isPaid ? 840000 : null,
          cotizacion_pago: isPaid ? 1400 : null,
          fecha_pago: isPaid ? vDate : null,
          recibo_nro: isPaid ? `REC-PREST-${3000 + i}` : null,
        },
      });
    }
  }

  // 11. Solicitudes Web de Préstamos con Documentos
  console.log('9. Creando solicitudes de préstamo y documentos adjuntos...');

  // Solicitud 1: Mariana Gómez (Pendiente)
  const existingSolMariana = await prisma.solicitudPrestamo.findFirst({
    where: { tenantId: tenant.id, id_cliente: clienteMariana.id_cliente },
  });

  if (!existingSolMariana) {
    const sol1 = await prisma.solicitudPrestamo.create({
      data: {
        tenantId: tenant.id,
        id_cliente: clienteMariana.id_cliente,
        monto_solicitado_usd: 2500,
        monto_solicitado_ars: 3500000,
        cantidad_cuotas: 12,
        motivo: 'Ampliación de taller y compra de insumos',
        ingresos_mensuales_ars: 1800000,
        estado: EstadoSolicitudPrestamo.PENDIENTE,
        observaciones_cliente: 'Adjunto DNI y comprobante de ingresos del último trimestre.',
        documentos: {
          create: [
            {
              tenantId: tenant.id,
              tipo_documento: 'Frente DNI',
              nombre_archivo: 'dni_frente_mariana.jpg',
              url_archivo: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=800&q=80',
              mime_type: 'image/jpeg',
              size_bytes: 245000,
            },
            {
              tenantId: tenant.id,
              tipo_documento: 'Comprobante de Ingresos',
              nombre_archivo: 'ingresos_mariana.pdf',
              url_archivo: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              mime_type: 'application/pdf',
              size_bytes: 512000,
            },
          ],
        },
      },
    });
  }

  // Solicitud 2: Roberto Díaz (En Revisión)
  const existingSolRoberto = await prisma.solicitudPrestamo.findFirst({
    where: { tenantId: tenant.id, id_cliente: clienteRoberto.id_cliente },
  });

  if (!existingSolRoberto) {
    await prisma.solicitudPrestamo.create({
      data: {
        tenantId: tenant.id,
        id_cliente: clienteRoberto.id_cliente,
        monto_solicitado_usd: 5000,
        monto_solicitado_ars: 7000000,
        cantidad_cuotas: 18,
        motivo: 'Renovación de flota utilitaria para reparto',
        ingresos_mensuales_ars: 3200000,
        estado: EstadoSolicitudPrestamo.EN_REVISION,
        observaciones_cliente: 'Solicito evaluación para cuotas fijas en dólares o pesos.',
        documentos: {
          create: [
            {
              tenantId: tenant.id,
              tipo_documento: 'Constancia CUIT / Monotributo',
              nombre_archivo: 'cuit_roberto.pdf',
              url_archivo: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              mime_type: 'application/pdf',
              size_bytes: 180000,
            },
          ],
        },
      },
    });
  }

  console.log('--- ✅ Seed para "testcars" finalizado con éxito ---');
  console.log(`
Resumen de credenciales de prueba:
--------------------------------------------------------------------------------------
🏢 Tenant: testcars (TestCars Motors)
🌐 Hostnames:
   - https://testcars.nanoapps.ar
   - https://testcars.localhost:3000
   - https://testcars.onlycars.nanoapps.ar

🔑 Usuario Admin ERP:
   - Email: admin@testcars.com.ar
   - Contraseña: TestCars2026!

📱 Acceso Clientes PWA (/portal):
   1. Juan Carlos Pérez
      - DNI: 32111222 | Clave: 123456
      - Tiene: 1 Plan de venta de Hilux (5 pagas, 7 pendientes) + 1 Préstamo USD 3.000 (2 pagas, 4 pendientes)
   2. Mariana Gómez
      - DNI: 35222333 | Clave: 123456
      - Tiene: 1 Plan de cuotas de Tornado (3 pagas, 3 pendientes) + 1 Solicitud de préstamo PENDIENTE con 2 docs
   3. Roberto Díaz
      - DNI: 28333444 | Clave: 123456
      - Tiene: 1 Solicitud de préstamo EN_REVISION con docs
   4. Florencia Rossi
      - DNI: 40444555 | Sin clave aún (para probar creación de clave / reseteo desde admin o PWA)

🚗 Vehículos y Catálogo Online:
   - VW Amarok V6 2023: LISTO_PARA_VENTA | publicadoWeb: true (Visible)
   - Peugeot 208 Feline 2022: EN_CONSIGNACION | publicadoWeb: true (Visible)
   - Chevrolet Cruze 2020: LISTO_PARA_VENTA | publicadoWeb: false (OCULTO - NO sale en /portal/catalogo)
   - Yamaha MT-03 2022: LISTO_PARA_VENTA | publicadoWeb: true (Visible)
   - Kawasaki Versys-X 300 2023: LISTO_PARA_VENTA | publicadoWeb: true (Visible)
--------------------------------------------------------------------------------------
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed testcars:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
