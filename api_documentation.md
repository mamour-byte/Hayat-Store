# 📘 Documentation API E-Commerce - Guide d'Intégration Frontend

Cette documentation est le guide complet à destination des développeurs Frontend (React, Next.js, Vue, Mobile React Native / Flutter) pour intégrer l'API E-Commerce **Hayat Store**.

---

## 📌 Informations Générales & Headers API

- **Base URL** : `http://localhost:3000` (Dev) ou `https://api.hayatstore.com` (Prod)
- **Format des données** : JSON (`Content-Type: application/json`)
- **Authentification** : Bearer Token dans le header `Authorization: Bearer <access_token>`
- **Gestion des Sessions Guests (Panier sans compte)** : Header HTTP `X-Session-Id: <uuid_ou_session_id>`

---

## 1. 🔑 Authentification (`/auth`)

### 1.1 Inscription (`POST /auth/register`)
Créer un compte client.
- **Headers** : `Content-Type: application/json`
- **Body** :
```json
{
  "email": "client@example.com",
  "password": "Password123!",
  "firstName": "Mamour",
  "lastName": "Diallo",
  "phone": "+221770000000"
}
```
- **Réponse (201 Created)** :
```json
{
  "user": {
    "id": "cuid_user_123",
    "email": "client@example.com",
    "firstName": "Mamour",
    "lastName": "Diallo",
    "phone": "+221770000000",
    "role": "CUSTOMER"
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

---

### 1.2 Connexion (`POST /auth/login`)
Se connecter à un compte existant.
- **Body** :
```json
{
  "email": "client@example.com",
  "password": "Password123!"
}
```
- **Réponse (200 OK)** : Idem `register` (`user`, `accessToken`, `refreshToken`).

---

### 1.3 Rafraîchir le Token Access (`POST /auth/refresh`)
Obtenir un nouveau JWT token sans se ré-authentifier.
- **Body** :
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

---

### 1.4 Déconnexion (`POST /auth/logout`)
Révoker un token de rafraîchissement.
- **Headers** : `Authorization: Bearer <access_token>`
- **Body** :
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

---

### 1.5 Profil Utilisateur Connecté (`GET /auth/me`)
Obtenir les détails de la session courante.
- **Headers** : `Authorization: Bearer <access_token>`

---

## 2. 📦 Produits (`/products`), Catégories & Marques

### 2.1 Lister les Produits (`GET /products`)
Récupérer les produits avec filtres, recherche et pagination.
- **Query Params** :
  - `page` (default: 1)
  - `limit` (default: 10)
  - `search` (ex: `"iPhone"`)
  - `categoryId` (id de la catégorie)
  - `brandId` (id de la marque)
  - `minPrice` & `maxPrice`
  - `status` (`ACTIVE`, `DRAFT`, `ARCHIVED`)
  - `sortBy` (`price`, `createdAt`, `name`) & `sortOrder` (`asc`, `desc`)
- **Exemple de requête** : `GET /products?page=1&limit=12&search=chaussure&sortBy=price&sortOrder=asc`
- **Réponse (200 OK)** :
```json
{
  "data": [
    {
      "id": "prod_123",
      "name": "Chaussure Running Sport",
      "slug": "chaussure-running-sport",
      "price": "25000",
      "compareAtPrice": "30000",
      "stock": 15,
      "status": "ACTIVE",
      "images": [{ "url": "https://res.cloudinary.com/..." }]
    }
  ],
  "meta": { "total": 45, "page": 1, "limit": 12, "totalPages": 4 }
}
```

---

### 2.2 Détail d'un Produit par Slug (`GET /products/slug/:slug`)
- **Exemple** : `GET /products/slug/chaussure-running-sport`
- **Réponse (200 OK)** :
```json
{
  "id": "prod_123",
  "name": "Chaussure Running Sport",
  "slug": "chaussure-running-sport",
  "description": "Excellente chaussure respirante...",
  "price": "25000",
  "hasVariants": true,
  "images": [
    { "id": "img_1", "url": "https://res.cloudinary.com/...", "isPrimary": true }
  ],
  "variants": [
    { "id": "var_42", "sku": "RUN-42-BLK", "name": "Pointure 42 / Noir", "price": "25000", "stock": 5 }
  ],
  "category": { "id": "cat_1", "name": "Chaussures", "slug": "chaussures" },
  "brand": { "id": "br_1", "name": "Nike", "slug": "nike" }
}
```

---

### 2.3 Lister les Catégories (`GET /categories`) & Marques (`GET /brands`)
- `GET /categories` : Arborescence complète des catégories.
- `GET /brands` : Liste des marques actives.

---

## 3. 🛒 Panier d'Achat (`/cart`)

> 💡 **Gestion Guest & Auth** : Transmettez le header `X-Session-Id: uuid` pour les utilisateurs non connectés, ou `Authorization: Bearer token` pour les utilisateurs connectés.

### 3.1 Obtenir le Panier (`GET /cart`)
- **Headers** : `X-Session-Id: guest_session_123` ou `Authorization: Bearer token`
- **Réponse (200 OK)** :
```json
{
  "id": "cart_999",
  "status": "ACTIVE",
  "items": [
    {
      "id": "item_1",
      "productId": "prod_123",
      "variantId": "var_42",
      "quantity": 2,
      "unitPrice": "25000",
      "product": {
        "name": "Chaussure Running Sport",
        "images": [{ "url": "https://..." }]
      },
      "variant": { "name": "Pointure 42 / Noir" }
    }
  ],
  "meta": { "itemCount": 2, "total": 50000 }
}
```

---

### 3.2 Ajouter un Article au Panier (`POST /cart/items`)
- **Body** :
```json
{
  "productId": "prod_123",
  "variantId": "var_42",
  "quantity": 1
}
```

---

### 3.3 Modifier la Quantité (`PATCH /cart/items/:itemId`)
- **Body** : `{ "quantity": 3 }`

---

### 3.4 Supprimer un Article (`DELETE /cart/items/:itemId`) & Vider (`DELETE /cart`)

---

### 3.5 Fusionner le Panier Guest après Connexion (`POST /cart/merge`)
- **Headers** : `Authorization: Bearer <user_access_token>`
- **Body** : `{ "sessionId": "guest_session_123" }`

---

## 4. 🎟️ Coupons de Réduction (`/coupons`)

### 4.1 Tester un Code Promo sur le Panier (`POST /coupons/validate`)
Client teste un code promo au checkout avant de valider.
- **Body** :
```json
{
  "code": "FLASH50",
  "subtotal": 20000,
  "shippingAmount": 1500
}
```
- **Réponse (200 OK)** :
```json
{
  "isValid": true,
  "coupon": {
    "id": "coup_1",
    "code": "FLASH50",
    "type": "PERCENTAGE",
    "value": 50
  },
  "discountAmount": 10000,
  "subtotal": 20000,
  "shippingAmount": 1500,
  "newTotal": 11500
}
```

---

## 5. 🚚 Expédition & Méthodes de Livraison (`/shipping`)

### 5.1 Lister les Modes de Livraison (`GET /shipping/methods`)
Utilisé dans la page Checkout du Frontend pour afficher les options de livraison.
- **Réponse (200 OK)** :
```json
[
  {
    "id": "ship_m_1",
    "name": "Livraison Express Dakar",
    "description": "Livré sous 24h à domicile",
    "price": "2000",
    "estimatedMinDays": 1,
    "estimatedMaxDays": 2
  }
]
```

---

### 5.2 Suivre un Colis Publique (`GET /shipping/track/:trackingNumber`)
- **Exemple** : `GET /shipping/track/TRK-987654`
- **Réponse (200 OK)** :
```json
{
  "id": "shipment_1",
  "carrier": "Colis Express SN",
  "trackingNumber": "TRK-987654",
  "status": "IN_TRANSIT",
  "shippedAt": "2026-08-24T10:00:00Z",
  "deliveredAt": null,
  "order": { "orderNumber": "ORD-20260824-A1B2C", "status": "SHIPPED" }
}
```

---

## 6. 📝 Passer et Gérer les Commandes (`/orders`)

### 6.1 Créer une Commande (`POST /orders`)
- **Headers** : Facultatif `Authorization: Bearer token` (Guest ou Authentifié)
- **Body (Option A - Depuis Panier)** :
```json
{
  "cartId": "cart_999",
  "customerEmail": "client@example.com",
  "customerPhone": "+221770000000",
  "shippingFirstName": "Mamour",
  "shippingLastName": "Diallo",
  "shippingAddress": "Sacré Cœur 3, Villa 12",
  "shippingCity": "Dakar",
  "shippingMethodId": "ship_m_1",
  "couponCode": "FLASH50"
}
```
- **Body (Option B - Articles directs)** :
```json
{
  "items": [{ "productId": "prod_123", "variantId": "var_42", "quantity": 1 }],
  "customerEmail": "guest@example.com",
  "customerPhone": "+221780000000",
  "shippingAddress": "Fann Résidence",
  "shippingCity": "Dakar"
}
```
- **Réponse (201 Created)** :
```json
{
  "id": "ord_1001",
  "orderNumber": "ORD-20260824-X9Y8Z",
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "subtotal": "25000",
  "discountAmount": "12500",
  "shippingAmount": "2000",
  "total": "14500",
  "items": [...]
}
```

---

### 6.2 Consulter Mes Commandes Client (`GET /orders/my-orders`)
- **Headers** : `Authorization: Bearer token`
- **Query Params** : `page`, `limit`, `status`

---

### 6.3 Annuler Ma Commande (`PATCH /orders/my-orders/:id/cancel`)
- **Headers** : `Authorization: Bearer token`

---

## 7. 💳 Initialiser un Paiement (`/payments`)

### 7.1 Initialiser un Paiement (`POST /payments/initiate`)
Supporte **Wave**, **Orange Money** et **Paiement à la livraison**.
- **Body** :
```json
{
  "orderId": "ord_1001",
  "provider": "WAVE"
}
```
- **Réponse (200 OK - WAVE)** :
```json
{
  "paymentId": "pay_555",
  "provider": "WAVE",
  "paymentUrl": "https://pay.wave.com/m/M_test_checkout_ORD-20260824-X9Y8Z",
  "status": "PENDING",
  "amount": 14500,
  "currency": "XOF"
}
```
- **Redirection Frontend** : Le Frontend redirige le navigateur du client vers `paymentUrl`. Dès validation, le client est redirigé vers `/checkout/success?orderId=ord_1001`.

#### Exemple pour Paiement à la livraison (`CASH_ON_DELIVERY`) :
- **Body** : `{ "orderId": "ord_1001", "provider": "CASH_ON_DELIVERY" }`
- **Réponse (200 OK)** :
```json
{
  "paymentId": "pay_556",
  "provider": "CASH_ON_DELIVERY",
  "paymentUrl": null,
  "status": "PENDING",
  "message": "Commande enregistrée avec succès. Paiement à la livraison."
}
```

---

## 8. ⭐️ Avis et Notes Produits (`/reviews`)

### 8.1 Déposer un Avis (`POST /reviews`)
- **Headers** : `Authorization: Bearer token`
- **Body** :
```json
{
  "productId": "prod_123",
  "orderId": "ord_1001",
  "rating": 5,
  "title": "Superbe qualité !",
  "comment": "Livraison très rapide à Dakar, produit conforme."
}
```

---

### 8.2 Consulter les Avis d'un Produit (`GET /reviews/product/:productId`)
- **Exemple** : `GET /reviews/product/prod_123`
- **Réponse (200 OK)** :
```json
{
  "data": [
    {
      "id": "rev_1",
      "rating": 5,
      "title": "Superbe qualité !",
      "comment": "Livraison très rapide...",
      "user": { "firstName": "Mamour", "lastName": "D." },
      "createdAt": "2026-08-24T15:00:00Z"
    }
  ],
  "meta": {
    "total": 12,
    "averageRating": 4.8,
    "ratingBreakdown": { "5": 10, "4": 2, "3": 0, "2": 0, "1": 0 }
  }
}
```

---

## 9. 🛠️ Espace Administration (Admin / Staff)

### Synthèse des Routes d'Administration (`Authorization: Bearer <admin_token>`) :

| Domaine | Méthode | Route | Description |
| :--- | :--- | :--- | :--- |
| **Produits** | `POST` / `PATCH` / `DELETE` | `/products` | Gestion catalogue et stock |
| **Commandes** | `GET` | `/orders` | Recherche et liste globale paginée |
| **Statut Commande** | `PATCH` | `/orders/:id/status` | Changer le statut (`CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`) |
| **Statut Paiement** | `PATCH` | `/orders/:id/payment-status` | Valider un paiement (`PAID`, `REFUNDED`) |
| **Coupons** | `POST` / `GET` / `PATCH` / `DELETE` | `/coupons` | Créer et piloter les campagnes promo |
| **Livraisons** | `PATCH` | `/shipping/shipments/:id/status` | Affecter transporteur & numéro de suivi |
| **Avis** | `PATCH` | `/reviews/:id/status` | Modérer les avis (`APPROVED` / `REJECTED`) |
| **Utilisateurs** | `GET` / `PATCH` | `/users` | Gestion des comptes et rôles |
