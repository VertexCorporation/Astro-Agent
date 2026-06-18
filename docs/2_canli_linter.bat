@echo off
echo [MoonCode] Flutter projesi dizininden Linter sonuclarini okuyorum...
cd /d "%~1"
if "%~1"=="" echo Hata: Proje dizinini parametre olarak verin. && exit /b
flutter analyze > "%~dp0linter_raporu.txt"
echo [MoonCode] Linter analizi tamamlandi. Sonuclar linter_raporu.txt icinde.
