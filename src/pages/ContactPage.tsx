import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';

const contactDetails = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@hayatstore.sn',
    href: 'mailto:support@hayatstore.sn',
  },
  {
    icon: Phone,
    label: 'Téléphone',
    value: '+221 77 000 00 00',
    href: 'tel:+221770000000',
  },
  {
    icon: MapPin,
    label: 'Adresse',
    value: 'Dakar, Sénégal',
  },
];

export const ContactPage: React.FC = () => {
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Message Hayat Store - ${form.get('subject')}`);
    const body = encodeURIComponent(
      `Nom : ${form.get('name')}\nEmail : ${form.get('email')}\n\n${form.get('message')}`,
    );

    window.location.href = `mailto:support@hayatstore.sn?subject=${subject}&body=${body}`;
    setIsSent(true);
    event.currentTarget.reset();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-3xl mb-10">
        <p className="text-xs font-bold uppercase tracking-wider text-[#008060] mb-3">Hayat Store</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1a1a]">Contactez-nous</h1>
        <p className="mt-3 text-[#6d7175] leading-relaxed">
          Une question sur un produit, une commande ou une livraison ? Notre équipe est à votre écoute.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6 items-start">
        <section className="bg-[#1a1a1a] text-white rounded-2xl p-7 sm:p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold">Parlons de votre besoin</h2>
            <p className="text-sm text-white/65 mt-2 leading-relaxed">
              Nous vous répondons rapidement pendant nos heures d'ouverture.
            </p>
          </div>

          <div className="space-y-6">
            {contactDetails.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#008060] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-white/55 uppercase tracking-wider">{label}</p>
                  {href ? (
                    <a href={href} className="text-sm font-medium hover:text-[#68d5b3] transition-colors">{value}</a>
                  ) : (
                    <p className="text-sm font-medium">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/15 pt-6 text-sm text-white/65">
            <p className="font-semibold text-white">Horaires</p>
            <p className="mt-1">Lundi au samedi, 9h00 à 18h00</p>
          </div>
        </section>

        <section className="bg-white border border-[#e1e3e5] rounded-2xl p-7 sm:p-8">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Envoyer un message</h2>
          <p className="text-sm text-[#6d7175] mt-2 mb-6">Décrivez-nous votre demande et nous reviendrons vers vous.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">Nom</span>
                <input name="name" required className="w-full px-3 py-2.5 rounded-lg border border-[#e1e3e5] bg-[#f6f6f7] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">Email</span>
                <input name="email" type="email" required className="w-full px-3 py-2.5 rounded-lg border border-[#e1e3e5] bg-[#f6f6f7] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]" />
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">Sujet</span>
              <input name="subject" required className="w-full px-3 py-2.5 rounded-lg border border-[#e1e3e5] bg-[#f6f6f7] text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">Message</span>
              <textarea name="message" required rows={5} className="w-full px-3 py-2.5 rounded-lg border border-[#e1e3e5] bg-[#f6f6f7] text-sm resize-y focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]" />
            </label>
            <button type="submit" className="inline-flex items-center gap-2 bg-[#008060] hover:bg-[#006e52] text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm">
              <Send className="w-4 h-4" />
              Envoyer le message
            </button>
            {isSent && <p className="text-sm text-[#008060]">Votre logiciel de messagerie va s'ouvrir pour envoyer le message.</p>}
          </form>
        </section>
      </div>
    </div>
  );
};
