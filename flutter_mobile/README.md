# SalesFlow CRM — Flutter Mobile App

## Setup

```bash
cd crm/flutter_mobile
flutter pub get
```

## Run

```bash
# iOS simulator
flutter run -d iphone

# Android emulator
flutter run -d android

# Physical device (list devices first)
flutter devices
flutter run -d <device-id>
```

## Build for release

```bash
# iOS .ipa
flutter build ios --release

# Android .apk
flutter build apk --release

# Android App Bundle (Play Store)
flutter build appbundle --release
```

## Structure

```
lib/
  main.dart                    # App root + auth gate
  providers/
    auth_provider.dart         # Login/logout/session restore
  services/
    api_service.dart           # All backend calls (https://crm-mjky.onrender.com/api)
  screens/
    login_screen.dart          # Email + password sign-in
    home_screen.dart           # Bottom nav shell
    voice_capture_screen.dart  # Mic → Whisper → AI extract
    review_screen.dart         # Edit AI fields → save lead
    leads_screen.dart          # Searchable leads list
```

## Features

- **Voice capture**: tap mic → speak → Groq Whisper transcribes → AI extracts name/company/email/phone/value → editable review → saves to CRM
- **Leads list**: searchable, pull-to-refresh, stage badges + deal values
- **Secure auth**: JWT stored in iOS Keychain / Android Keystore via `flutter_secure_storage`
