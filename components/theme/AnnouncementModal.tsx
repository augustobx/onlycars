'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TableroAnuncios, type AnnouncementData } from './TableroAnuncios';

export function AnnouncementModal() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // En la ruta /login el tablero se gestiona de forma sincronizada con el inicio de la animación
    if (pathname === '/login') return;

    let mounted = true;
    async function loadAnnouncement() {
      try {
        const res = await fetch('/api/announcement', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        if (data && data.active && data.id) {
          const dismissedKey = 'onlycars_announcement_dismissed_' + data.id;
          if (localStorage.getItem(dismissedKey) === 'true') {
            return;
          }
          setAnnouncement(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.warn('[AnnouncementModal] No se pudo cargar aviso:', err);
      }
    }
    loadAnnouncement();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  // Si estamos en login, la vista de login maneja su propio Tablero sincronizado
  if (pathname === '/login' || !isOpen || !announcement) return null;

  const handleDismissPermanent = () => {
    if (announcement.id) {
      localStorage.setItem('onlycars_announcement_dismissed_' + announcement.id, 'true');
    }
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <TableroAnuncios
      anuncio={announcement}
      onClose={handleClose}
      onDismissPermanent={handleDismissPermanent}
      systemName="OnlyCars"
    />
  );
}

export default AnnouncementModal;
