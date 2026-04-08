# MesClaude

Monorepo for a full-stack application built with .NET 10, Angular 19, and Flutter.

## Structure

| Directory | Stack | Purpose |
|-----------|-------|---------|
| `api/` | .NET 10 / ASP.NET Core Web API | Backend REST API |
| `web/` | Angular 19 | Web frontend |
| `mobile/` | Flutter | iOS & Android app |

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) + [Angular CLI](https://angular.io/cli)
- [Flutter SDK](https://flutter.dev/docs/get-started/install)

## Getting Started

```bash
# API
cd api
dotnet run

# Web
cd web
npm install && ng serve

# Mobile
cd mobile
flutter pub get && flutter run
```
