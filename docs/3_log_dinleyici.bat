@echo off
echo [MoonCode] Arka planda Hata (Error) ve Crash loglari dinleniyor...
echo Dinlemeyi durdurmak icin pencereyi kapatin.
adb logcat -c
adb logcat *:E -v time > "%~dp0crash_ve_hatalar.log"
