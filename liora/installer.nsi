!include "MUI2.nsh"

Name "Liora"
OutFile "build\bin\liora-installer.exe"
InstallDir "$PROGRAMFILES64\Liora"
ShowInstDetails show
ShowUninstDetails show

!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Russian"

Section "Install"
    SetOutPath "$INSTDIR"
    File "build\bin\liora.exe"
    
    WriteUninstaller "$INSTDIR\uninstall.exe"
    
    CreateShortCut "$DESKTOP\Liora.lnk" "$INSTDIR\liora.exe"
    CreateDirectory "$SMPROGRAMS\Liora"
    CreateShortCut "$SMPROGRAMS\Liora\Liora.lnk" "$INSTDIR\liora.exe"
    CreateShortCut "$SMPROGRAMS\Liora\Uninstall.lnk" "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
    Delete "$DESKTOP\Liora.lnk"
    Delete "$SMPROGRAMS\Liora\Liora.lnk"
    Delete "$SMPROGRAMS\Liora\Uninstall.lnk"
    RMDir "$SMPROGRAMS\Liora"
    
    Delete "$INSTDIR\liora.exe"
    Delete "$INSTDIR\uninstall.exe"
    RMDir "$INSTDIR"
SectionEnd