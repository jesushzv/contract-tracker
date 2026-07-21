# Mi Pacto 🤝 — Brand Guidelines & Asset Manual

Welcome to the official Brand Assets repository for **Mi Pacto** (Contract & Payment Tracker for Freelancers in Mexico). This directory contains vector assets, brand tokens, logos, badges, social share assets, and document templates.

---

## 🎨 1. Brand Identity Overview

**Mi Pacto** is a modern vertical SaaS platform built to empower Mexican freelancers and independent contractors. Our brand identity balances **legal trust and security** with **modern, calm confidence**.

- **Brand Personality**: Calm, Trustworthy, Modern, Precise, Mexican-Native.
- **Core Value Proposition**: Express digital contracts with legal weight, transparent SPEI payment verification, and SAT compliance.

---

## 🌈 2. Color Palette & Tokens

### Primary Brand Colors

| Color Name | HEX | HSL | Usage |
| :--- | :--- | :--- | :--- |
| **Morado Azteca** (Primary Indigo/Purple) | `#6A1B9A` | `hsl(277, 70%, 35%)` | Primary CTA buttons, brand icon gradient start, active states |
| **Turquesa Cielo** (Accent Turquoise) | `#00ACC1` | `hsl(187, 100%, 38%)` | Success indicators, verified badges, gradient end, key metrics |
| **Deep Slate** (Dark Chrome) | `#0F172A` | `hsl(222, 47%, 11%)` | Headings, dark surfaces, sidebar background |
| **Cool Emerald** (Success / SPEI) | `#059669` | `hsl(160, 84%, 39%)` | Payment verified status, CEP confirmations |

### Neutral Palette

| Token | HEX | Usage |
| :--- | :--- | :--- |
| **Background Light** | `#F8FAFC` | Main application background |
| **Card Surface** | `#FFFFFF` | Elevated cards, wizard panels |
| **Border Soft** | `#E2E8F0` | Structural dividers, 1px card outlines |
| **Text Secondary** | `#64748B` | Captions, subtitle labels, helper text |

---

## 🔤 3. Typography System

- **Primary Font**: `Nunito` — Used for body copy, UI buttons, inputs, and primary navigation.
- **Display Font**: `Outfit` or `Nunito (Bold 800)` — Used for major section headers, landing page hero text, and brand wordmarks.
- **Monospace Font**: `Geist Mono` / `Fira Code` — Used for SHA-256 hashes, CLABE numbers, tracking keys, and legal audit logs.

---

## 📁 4. Assets Directory Map

```text
branding/
├── README.md                           # This Brand Guide & Specification
├── tokens/
│   ├── color-palette.json              # Structured JSON color definitions
│   └── brand-tokens.css                # CSS variables for Web integration
├── logos/
│   ├── logo-full-light.svg             # Primary Full Logo (Horizontal - for Light backgrounds)
│   ├── logo-full-dark.svg              # Primary Full Logo (Horizontal - for Dark backgrounds)
│   ├── logo-mark.svg                   # Icon Mark only (Document + Checkmark Badge)
│   ├── logo-mark-dark.svg              # Icon Mark for Dark mode
│   ├── logo-wordmark-light.svg         # Wordmark only (Light mode)
│   ├── logo-wordmark-dark.svg          # Wordmark only (Dark mode)
│   ├── logo-monochrome-black.svg       # Flat Single-Color Black Logo
│   └── logo-monochrome-white.svg       # Flat Single-Color White Logo
├── icons/
│   ├── favicon.svg                     # Web Favicon Vector
│   ├── app-icon.svg                    # App Icon (512x512 format)
│   ├── apple-touch-icon.svg            # iOS Home Screen App Icon
│   └── favicon-32x32.svg               # Compact 32x32 favicon variant
├── badges/
│   ├── verified-seal-light.svg         # "Verificado por Mi Pacto - SHA-256" Seal Badge
│   ├── verified-seal-dark.svg          # Dark variant SHA-256 Integrity Badge
│   └── spei-verified-badge.svg         # "Pagos Verificados vía SPEI / Banxico" Badge
├── social/
│   ├── og-image.svg                    # OpenGraph / Social Share Card (1200x630)
│   ├── twitter-header.svg              # Twitter/X Header Banner (1500x500)
│   └── linkedin-banner.svg             # LinkedIn Company Header (1584x396)
└── templates/
    └── contract-letterhead.svg         # Printable/PDF Branding Header
```

---

## 📐 5. Logo Usage Rules

1. **Clear Space**: Maintain a minimum clear space equal to the height of the icon mark around the full logo.
2. **Minimum Size**:
   - Digital (Full Logo): Minimum width `120px`
   - Digital (Icon Mark): Minimum width `24px`
3. **Do NOT**:
   - Do not stretch, warp, or alter logo proportions.
   - Do not change logo gradient colors outside specified tokens.
   - Do not place dark text logo on dark backgrounds without sufficient contrast.
