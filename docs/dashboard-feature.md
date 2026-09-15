# Dashboard Feature Specification

## 1. Overview

Dashboard menampilkan ringkasan kondisi akun dan aktivitas finansial user setelah login.

Dashboard bersifat read-only. Dashboard tidak boleh melakukan perubahan saldo, transaksi, status KYC, atau data akun.

Endpoint utama:

GET /api/v1/dashboard

Authentication:

Bearer JWT wajib digunakan.

---

## 2. Dashboard Goals

Dashboard harus membantu user melihat:

- Informasi akun
- Status wallet
- Total saldo wallet
- Status verifikasi email
- Status KYC
- Limit transaksi
- Ringkasan aktivitas finansial
- Cash flow
- Transaksi terbaru
- Notifikasi atau security warning jika tersedia

---

## 3. Dashboard Layout

Dashboard frontend terdiri dari:

### 3.1 Header

Menampilkan:

- Nama user
- Search transaksi
- Notification shortcut
- Profile shortcut

Nama user diambil dari data user yang sedang login.

Jika `firstName` dan `lastName` tidak tersedia, gunakan email sebagai fallback.

---

### 3.2 Welcome Section

Menampilkan sapaan kepada user.

Contoh:

```text
Welcome back, Rizq

Recommended Response Structure

Response dashboard harus menggunakan format response standar project.

Contoh struktur konseptual:

{
  "success": true,
  "message": "Dashboard retrieved successfully",
  "data": {
    "user": {
      "id": "user-id",
      "firstName": "Rizq",
      "lastName": "Syafriano",
      "email": "user@example.com",
      "isEmailVerified": true
    },
    "wallet": {
      "balance": "1500000.00",
      "currency": "IDR",
      "isActive": true
    },
    "accountOverview": {
      "accountStatus": "ACTIVE",
      "walletStatus": "ACTIVE",
      "emailVerified": true,
      "kycStatus": "APPROVED",
      "kycTier": "VERIFIED"
    },
    "monthlySummary": {
      "period": "2026-09",
      "topUp": "5000000.00",
      "transfer": "1250000.00",
      "withdrawal": "750000.00"
    },
    "transferLimits": {
      "daily": {
        "limit": "10000000.00",
        "used": "1500000.00",
        "remaining": "8500000.00"
      },
      "monthly": {
        "limit": "50000000.00",
        "used": "7500000.00",
        "remaining": "42500000.00"
      }
    },
    "recentTransactions": []
  }
}

Struktur di atas adalah target kontrak konseptual.

Sebelum implementasi:

Periksa Prisma schema.
Periksa model dan enum yang sudah tersedia.
Periksa repository yang sudah ada.
Periksa service dan controller dashboard.
Gunakan nama field yang benar-benar tersedia di project.
Jangan membuat field, enum, tabel, atau relation baru tanpa alasan yang jelas.