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

          {/* Platform Features */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-3">Platform Features</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features">
                  <span className="hover:text-orange-500 transition-colors">AI-Powered Marketing</span>
                </Link>
              </li>
              <li>
                <Link href="/content">
                  <span className="hover:text-orange-500 transition-colors">Content Management</span>
                </Link>
              </li>
              <li>
                <Link href="/analytics">
                  <span className="hover:text-orange-500 transition-colors">Analytics Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/growth">
                  <span className="hover:text-orange-500 transition-colors">Audience Growth</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-3">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/virtual-record-label">
                  <span className="hover:text-orange-500 transition-colors">Virtual Record Label</span>
                </Link>
              </li>
              <li>
                <Link href="/record-label-services">
                  <span className="hover:text-orange-500 transition-colors">Record Label Services</span>
                </Link>
              </li>
              <li>
                <Link href="/youtube-views">
                  <span className="hover:text-orange-500 transition-colors">YouTube Views</span>
                </Link>
              </li>
              <li>
                <Link href="/instagram-boost">
                  <span className="hover:text-orange-500 transition-colors">Instagram Growth</span>
                </Link>
              </li>
              <li>
                <Link href="/promotion">
                  <span className="hover:text-orange-500 transition-colors">Music Promotion</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Metafeed & Boostify */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-3">Metafeed & Boostify</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/metaverse">
                  <span className="hover:text-orange-500 transition-colors">Metafeed Metaverse</span>
                </Link>
              </li>
              <li>
                <Link href="/token">
                  <span className="hover:text-orange-500 transition-colors">Metafeed Token</span>
                </Link>
              </li>
              <li>
                <Link href="/one-artist-token">
                  <span className="hover:text-orange-500 transition-colors">One Artist One Token</span>
                </Link>
              </li>
              <li>
                <Link href="/ecosystem">
                  <span className="hover:text-orange-500 transition-colors">View Ecosystem</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Avat Pro & Boostify */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-3">Avat Pro & Boostify</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/avatars">
                  <span className="hover:text-orange-500 transition-colors">Hyper Realistic Avatars</span>
                </Link>
              </li>
              <li>
                <Link href="/unreal-engine">
                  <span className="hover:text-orange-500 transition-colors">Unreal Engine</span>
                </Link>
              </li>
              <li>
                <Link href="/motion-capture">
                  <span className="hover:text-orange-500 transition-colors">Motion Capture</span>
                </Link>
              </li>
              <li>
                <Link href="/partnership">
                  <span className="hover:text-orange-500 transition-colors">View Partnership</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-white/60">
            &copy; {currentYear} Boostify Music. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-white/60 mt-4 md:mt-0">
            <Link href="/terms">
              <span className="hover:text-white transition-colors">Terms</span>
            </Link>
            <Link href="/privacy">
              <span className="hover:text-white transition-colors">Privacy</span>
            </Link>
            <Link href="/cookies">
              <span className="hover:text-white transition-colors">Cookies</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}