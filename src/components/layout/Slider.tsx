"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./Slider.css";

/**
 * Slider – carrousel produit "flottant" (converti depuis le template Airpod).
 *
 * - Autoplay: avance automatiquement toutes les `autoPlayInterval` ms (5000 par défaut).
 * - Flèches prev/next pour naviguer manuellement (réinitialise le timer d'autoplay).
 * - Même logique d'animation que l'original: on déplace les noeuds DOM (au lieu de
 *   re-render React) pour garder exactement la même fluidité CSS (transitions,
 *   keyframes, blur/scale en cascade). Les items sont donc statiques après le montage:
 *   si `items` change dynamiquement après coup, remonte le composant avec une `key`.
 *
 * Aucune dépendance externe: colle ce fichier tel quel dans ton projet React/Next.js.
 * Pense à charger la police Poppins globalement (ex: dans app/layout.tsx ou index.html):
 *   https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap
 *
 * Le CSS est extrait dans ./Slider.css (importé ci-dessus).
 */

export interface SlideItem {
  id: string | number;
  /** Chemin vers un PNG transparent (sans fond) */
  image: string;
  alt?: string;
  /** Petit label au-dessus du titre, ex: "DESIGN SLIDER" */
  eyebrow?: string;
  /** Gros titre du produit, ex: "Airpod" */
  title: string;
  /** Texte descriptif */
  description: string;
}

export interface SliderProps {
  items: SlideItem[];
  /** Intervalle de défilement automatique en ms (défaut: 5000) */
  autoPlayInterval?: number;
  className?: string;
}

export default function Slider({
  items,
  autoPlayInterval = 5000,
  className = "",
}: SliderProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const unlockTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const showSlider = useCallback((type: "next" | "prev") => {
    const carousel = carouselRef.current;
    const list = listRef.current;
    const nextBtn = nextRef.current;
    const prevBtn = prevRef.current;
    if (!carousel || !list || !nextBtn || !prevBtn) return;

    nextBtn.style.pointerEvents = "none";
    prevBtn.style.pointerEvents = "none";

    carousel.classList.remove("next", "prev");
    // force reflow pour pouvoir rejouer la même animation en boucle (ex: autoplay répété)
    void carousel.offsetWidth;

    const itemEls = list.querySelectorAll<HTMLElement>(".item");
    if (itemEls.length === 0) return;

    if (type === "next") {
      list.appendChild(itemEls[0]);
      carousel.classList.add("next");
    } else {
      list.prepend(itemEls[itemEls.length - 1]);
      carousel.classList.add("prev");
    }

    if (unlockTimeout.current) clearTimeout(unlockTimeout.current);
    unlockTimeout.current = setTimeout(() => {
      nextBtn.style.pointerEvents = "auto";
      prevBtn.style.pointerEvents = "auto";
    }, 2000);
  }, []);

  const resetAutoplay = useCallback(() => {
    if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    autoplayTimer.current = setInterval(() => showSlider("next"), autoPlayInterval);
  }, [showSlider, autoPlayInterval]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
      if (unlockTimeout.current) clearTimeout(unlockTimeout.current);
    };
  }, [resetAutoplay]);

  const handleNext = () => {
    showSlider("next");
    resetAutoplay();
  };
  const handlePrev = () => {
    showSlider("prev");
    resetAutoplay();
  };

  return (
    <div className={`pod-slider ${className}`}>
      <div className="carousel" ref={carouselRef}>
        <div className="list" ref={listRef}>
          {items.map((item) => (
            <div className="item" key={item.id}>
              <img src={item.image} alt={item.alt ?? item.title} draggable={false} loading="eager" decoding="async" width={1200} height={600} />
              <div className="introduce">
                {item.eyebrow && <div className="eyebrow">{item.eyebrow}</div>}
                <div className="topic">{item.title}</div>
                <div className="des">{item.description}</div>
                <Link className="shop-cta" to="/products">
                  Acheter maintenant
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="arrows">
          <button ref={prevRef} onClick={handlePrev} aria-label="Précédent" type="button">
            ‹
          </button>
          <button ref={nextRef} onClick={handleNext} aria-label="Suivant" type="button">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Exemple d'utilisation :

import Slider, { SlideItem } from "./slider";

const podItems: SlideItem[] = [
  {
    id: 1,
    image: "/images/img1.png",
    eyebrow: "DESIGN SLIDER",
    title: "Airpod",
    description:
      "Autonomie longue durée, réduction de bruit active et confort tout au long de la journée.",
  },
  {
    id: 2,
    image: "/images/img2.png",
    eyebrow: "DESIGN SLIDER",
    title: "Airpod Pro",
    description:
      "Un son plus précis, une charge rapide via USB-C et un contrôle tactile intuitif.",
  },
  // ... jusqu'à 6 items pour garder l'effet de profondeur en cascade
];

export default function Page() {
  return <Slider items={podItems} autoPlayInterval={5000} />;
}

*/
