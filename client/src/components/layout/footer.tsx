import React from "react";
import { Link } from "wouter";
import {
  Github,
  Twitter,
  Instagram,
  Youtube,
  ExternalLink,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-zinc-800 pt-16 pb-12 text-white/80">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo y descripción */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img
                src="/assets/freepik__boostify_music_organe_abstract_icon.png"
                alt="Boostify Music"
                className="h-8 w-8"
              />
              <h2 className="text-xl font-bold text-white">Boostify Music</h2>
            </div>
            <p className="text-sm md:pr-8">
              La plataforma de IA que está revolucionando cómo los artistas crean, promocionan y crecen en la industria musical.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-orange-500 transition-colors"
              >
                <Twitter size={18} />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-orange-500 transition-colors"
              >
                <Instagram size={18} />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-orange-500 transition-colors"
              >
                <Youtube size={18} />
                <span className="sr-only">YouTube</span>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-orange-500 transition-colors"
              >
                <Github size={18} />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>

          {/* Navegación rápida */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-3">Plataforma</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features">
                  <a className="hover:text-orange-500 transition-colors">Características</a>
                </Link>
              </li>
              <li>
                <Link href="/pricing">
                  <a className="hover:text-orange-500 transition-colors">Precios</a>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <a className="hover:text-orange-500 transition-colors">Blog</a>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <a className="hover:text-orange-500 transition-colors">Sobre nosotros</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legales */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms">
                  <a className="hover:text-orange-500 transition-colors">Términos de servicio</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="hover:text-orange-500 transition-colors">Política de privacidad</a>
                </Link>
              </li>
              <li>
                <Link href="/cookies">
                  <a className="hover:text-orange-500 transition-colors">Política de cookies</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-3">Contacto</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-1">
                <span>hello@boostifymusic.com</span>
                <ExternalLink size={14} className="text-white/50" />
              </li>
              <li>Barcelona, España</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-white/60">
            &copy; {currentYear} Boostify Music. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-xs text-white/60 mt-4 md:mt-0">
            <Link href="/terms">
              <a className="hover:text-white transition-colors">Términos</a>
            </Link>
            <Link href="/privacy">
              <a className="hover:text-white transition-colors">Privacidad</a>
            </Link>
            <Link href="/cookies">
              <a className="hover:text-white transition-colors">Cookies</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}