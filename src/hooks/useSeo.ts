import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const SITE_NAME = 'Hayat Store';
export const SITE_URL = 'https://www.hayat-sn.store';

interface SeoOptions {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'product';
  jsonLd?: object;
  noindex?: boolean;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSeo(options: SeoOptions) {
  const { title, description, image, type = 'website', jsonLd, noindex } = options;
  const { pathname, search } = useLocation();
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    const canonicalUrl = `${SITE_URL}${pathname}${search}`;
    upsertLink('canonical', canonicalUrl);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    if (description) upsertMeta('name', 'description', description);

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:type', type);
    if (description) upsertMeta('property', 'og:description', description);
    if (image) upsertMeta('property', 'og:image', image);

    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', fullTitle);
    if (description) upsertMeta('name', 'twitter:description', description);
    if (image) upsertMeta('name', 'twitter:image', image);

    document.head
      .querySelectorAll('script[data-seo-jsonld]')
      .forEach((el) => el.remove());

    if (jsonLdKey) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = jsonLdKey;
      document.head.appendChild(script);
    }
  }, [title, description, image, type, noindex, pathname, search, jsonLdKey]);
}
