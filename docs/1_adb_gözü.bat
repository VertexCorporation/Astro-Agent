@echo off
echo [MoonCode] Cihaz ekran goruntusu ve UI agaci aliniyor...
adb exec-out screencap -p > "%~dp0emulator_screenshot.png"
adb shell uiautomator dump /sdcard/mooncode_ui.xml
adb pull /sdcard/mooncode_ui.xml "%~dp0ui_tree.xml"
echo [MoonCode] Islemler tamam. UI Agaci ui_tree.xml olarak, goruntu emulator_screenshot.png olarak kaydedildi.
