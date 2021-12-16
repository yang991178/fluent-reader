Option Explicit

Dim objShell, objFSO, objFile, objFolder
Dim objFolderItem, colItems, objFont
Dim strFileName


Const FONTS = &H14& ' Fonts Folder

' Instantiate Objects
Set objShell = CreateObject("Shell.Application")
Set objFolder = objShell.Namespace(FONTS)
Set objFolderItem = objFolder.Self
Set colItems = objFolder.Items
Set objFSO = CreateObject("Scripting.FileSystemObject")

For Each objFont in colItems
    WScript.StdOut.WriteLine(objFont.Path & vbtab & objFont.Name)
Next

Set objShell = nothing
Set objFile = nothing
Set objFolder = nothing
Set objFolderItem = nothing
Set colItems = nothing
Set objFont = nothing
Set objFSO = nothing

wscript.quit
