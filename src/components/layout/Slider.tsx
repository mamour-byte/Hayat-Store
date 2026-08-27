"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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
              <img src={item.image} alt={item.alt ?? item.title} draggable={false} />
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

      <style>{`
        .pod-slider {
          --item1-transform: translateX(-100%) translateY(-5%) scale(1.5);
          --item1-filter: blur(30px);
          --item1-zIndex: 11;
          --item1-opacity: 0;

          --item2-transform: translateX(0);
          --item2-filter: blur(0px);
          --item2-zIndex: 10;
          --item2-opacity: 1;

          --item3-transform: translate(50%, 10%) scale(0.8);
          --item3-filter: blur(10px);
          --item3-zIndex: 9;
          --item3-opacity: 1;

          --item4-transform: translate(90%, 20%) scale(0.5);
          --item4-filter: blur(30px);
          --item4-zIndex: 8;
          --item4-opacity: 1;

          --item5-transform: translate(120%, 30%) scale(0.3);
          --item5-filter: blur(40px);
          --item5-zIndex: 7;
          --item5-opacity: 0;

          font-family: "Poppins", ui-sans-serif, system-ui, sans-serif;
        }

        .pod-slider .carousel {
          position: relative;
          height: clamp(560px, 68vh, 680px);
          overflow: hidden;
        }
        .pod-slider .carousel::before {
          width: 500px;
          height: 300px;
          content: "";
          background-image: linear-gradient(70deg, #dc422a, blue);
          position: absolute;
          z-index: -1;
          border-radius: 20% 30% 80% 10%;
          filter: blur(150px);
          top: 50%;
          left: 50%;
          transform: translate(-10%, -50%);
          transition: 1s;
        }

        .pod-slider .list {
          position: absolute;
          width: 1140px;
          max-width: 90%;
          height: 90%;
          left: 50%;
          transform: translateX(-50%);
        }
        .pod-slider .list .item {
          position: absolute;
          left: 0%;
          width: 70%;
          height: 100%;
          font-size: 15px;
          transition: left 0.5s, opacity 0.5s, width 0.5s;
        }
        .pod-slider .list .item:nth-child(n + 6) {
          opacity: 0;
        }
        .pod-slider .list .item:nth-child(2) {
          z-index: 10;
          transform: translateX(0);
        }
        .pod-slider .list .item img {
          width: 50%;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          transition: right 1.5s;
          user-select: none;
        }

        .pod-slider .list .item .introduce {
          opacity: 0;
          pointer-events: none;
        }
        .pod-slider .list .item:nth-child(2) .introduce {
          opacity: 1;
          pointer-events: auto;
          width: 400px;
          max-width: 100%;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          transition: opacity 0.5s;
        }
        .pod-slider .list .item .introduce .eyebrow {
          font-size: 1.1em;
          font-weight: 500;
          line-height: 1em;
        }
        .pod-slider .list .item .introduce .topic {
          font-size: clamp(2.5em, 5vw, 3.5em);
          font-weight: 500;
          color: #111;
        }
        .pod-slider .list .item .introduce .des {
          font-size: small;
          color: #5559;
        }
        .pod-slider .shop-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          padding-bottom: 6px;
          color: #008060;
          border-bottom: 1px solid currentColor;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: gap 0.2s, color 0.2s;
        }
        .pod-slider .shop-cta:hover {
          gap: 12px;
          color: #006e52;
        }

        .pod-slider .list .item:nth-child(1) {
          transform: var(--item1-transform);
          filter: var(--item1-filter);
          z-index: var(--item1-zIndex);
          opacity: var(--item1-opacity);
          pointer-events: none;
        }
        .pod-slider .list .item:nth-child(3) {
          transform: var(--item3-transform);
          filter: var(--item3-filter);
          z-index: var(--item3-zIndex);
        }
        .pod-slider .list .item:nth-child(4) {
          transform: var(--item4-transform);
          filter: var(--item4-filter);
          z-index: var(--item4-zIndex);
        }
        .pod-slider .list .item:nth-child(5) {
          transform: var(--item5-transform);
          filter: var(--item5-filter);
          opacity: var(--item5-opacity);
          pointer-events: none;
        }

        /* apparition du texte de l'item actif (position 2) */
        .pod-slider .list .item:nth-child(2) .introduce .eyebrow,
        .pod-slider .list .item:nth-child(2) .introduce .topic,
        .pod-slider .list .item:nth-child(2) .introduce .des {
          opacity: 0;
          animation: pod-showContent 0.5s 1s ease-in-out 1 forwards;
        }
        @keyframes pod-showContent {
          from {
            transform: translateY(-30px);
            filter: blur(10px);
          }
          to {
            transform: translateY(0);
            opacity: 1;
            filter: blur(0px);
          }
        }
        .pod-slider .list .item:nth-child(2) .introduce .topic {
          animation-delay: 1.2s;
        }
        .pod-slider .list .item:nth-child(2) .introduce .des {
          animation-delay: 1.4s;
        }

        /* clic "next" */
        .pod-slider .carousel.next .item:nth-child(1) {
          animation: pod-fromPos2 0.5s ease-in-out 1 forwards;
        }
        @keyframes pod-fromPos2 {
          from {
            transform: var(--item2-transform);
            filter: var(--item2-filter);
            opacity: var(--item2-opacity);
          }
        }
        .pod-slider .carousel.next .item:nth-child(2) {
          animation: pod-fromPos3 0.7s ease-in-out 1 forwards;
        }
        @keyframes pod-fromPos3 {
          from {
            transform: var(--item3-transform);
            filter: var(--item3-filter);
            opacity: var(--item3-opacity);
          }
        }
        .pod-slider .carousel.next .item:nth-child(3) {
          animation: pod-fromPos4 0.9s ease-in-out 1 forwards;
        }
        @keyframes pod-fromPos4 {
          from {
            transform: var(--item4-transform);
            filter: var(--item4-filter);
            opacity: var(--item4-opacity);
          }
        }
        .pod-slider .carousel.next .item:nth-child(4) {
          animation: pod-fromPos5 1.1s ease-in-out 1 forwards;
        }
        @keyframes pod-fromPos5 {
          from {
            transform: var(--item5-transform);
            filter: var(--item5-filter);
            opacity: var(--item5-opacity);
          }
        }

        /* clic "prev" */
        .pod-slider .carousel.prev .list .item:nth-child(5) {
          animation: pod-fromPos4 0.5s ease-in-out 1 forwards;
        }
        .pod-slider .carousel.prev .list .item:nth-child(4) {
          animation: pod-fromPos3 0.7s ease-in-out 1 forwards;
        }
        .pod-slider .carousel.prev .list .item:nth-child(3) {
          animation: pod-fromPos2 0.9s ease-in-out 1 forwards;
        }
        .pod-slider .carousel.prev .list .item:nth-child(2) {
          animation: pod-fromPos1 1.1s ease-in-out 1 forwards;
        }
        @keyframes pod-fromPos1 {
          from {
            transform: var(--item1-transform);
            filter: var(--item1-filter);
            opacity: var(--item1-opacity);
          }
        }

        .pod-slider .arrows {
          position: absolute;
          bottom: 20px;
          width: 1140px;
          max-width: 90%;
          display: flex;
          justify-content: space-between;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
        }
        .pod-slider .arrows button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-family: monospace;
          border: 1px solid #5555;
          background: transparent;
          font-size: 1.2rem;
          line-height: 1;
          cursor: pointer;
          transition: background 0.3s;
        }
        .pod-slider .arrows button:hover {
          background: #eee;
        }

        @media screen and (max-width: 991px) {
          .pod-slider .list .item {
            width: 90%;
          }
        }
        @media screen and (max-width: 767px) {
          .pod-slider .carousel {
            height: 430px;
          }
          .pod-slider .list {
            height: 100%;
          }
          .pod-slider .list .item {
            width: 100%;
            font-size: 10px;
          }
          .pod-slider .list .item:nth-child(2) .introduce {
            width: 62%;
          }
          .pod-slider .list .item img {
            width: 40%;
          }
          .pod-slider .list .item .introduce .des {
            max-height: 72px;
            overflow: auto;
          }
        }
      `}</style>
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