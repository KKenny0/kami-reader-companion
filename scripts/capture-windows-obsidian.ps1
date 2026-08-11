param(
  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [string]$FixtureVaultName = "visual-vault",

  [string]$ObsidianVersion = "1.13.6",

  [string]$ExactWindowTitle
)

$ErrorActionPreference = "Stop"

Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class KamiReaderWindowCapture {
    [StructLayout(LayoutKind.Sequential)]
    public struct Rect {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public sealed class WindowInfo {
        public IntPtr Handle { get; set; }
        public string Title { get; set; }
        public uint ProcessId { get; set; }
    }

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out Rect rect);

    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdc, uint flags);

    [DllImport("user32.dll")]
    public static extern uint GetDpiForWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool SetProcessDpiAwarenessContext(IntPtr value);

    [DllImport("user32.dll")]
    private static extern bool EnumWindows(EnumWindowsProc callback, IntPtr parameter);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    private static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr parameter);

    public static List<WindowInfo> GetTitledWindows() {
        var windows = new List<WindowInfo>();
        EnumWindows((hWnd, _) => {
            var length = GetWindowTextLength(hWnd);
            if (length == 0) return true;
            var title = new StringBuilder(length + 1);
            GetWindowText(hWnd, title, title.Capacity);
            uint processId;
            GetWindowThreadProcessId(hWnd, out processId);
            windows.Add(new WindowInfo {
                Handle = hWnd,
                Title = title.ToString(),
                ProcessId = processId
            });
            return true;
        }, IntPtr.Zero);
        return windows;
    }
}
"@

Add-Type -AssemblyName System.Drawing.Common

# PER_MONITOR_AWARE_V2 prevents Windows from virtualizing GetWindowRect on
# scaled displays. Failure is harmless when the host process is already aware.
[void][KamiReaderWindowCapture]::SetProcessDpiAwarenessContext([IntPtr](-4))

$expectedSuffix = "$FixtureVaultName - Obsidian $ObsidianVersion"
$matchingWindows = [KamiReaderWindowCapture]::GetTitledWindows() |
  Where-Object {
    $process = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue
    $process -and $process.ProcessName -eq "Obsidian" -and
      $(if ($ExactWindowTitle) {
        $_.Title.Equals($ExactWindowTitle, [StringComparison]::Ordinal)
      } else {
        $_.Title.EndsWith($expectedSuffix, [StringComparison]::Ordinal)
      })
  }

if (@($matchingWindows).Count -ne 1) {
  $titles = @($matchingWindows | ForEach-Object Title) -join " | "
  $selector = if ($ExactWindowTitle) {
    "titled '$ExactWindowTitle'"
  } else {
    "ending with '$expectedSuffix'"
  }
  throw "Expected exactly one Obsidian fixture window $selector; found $(@($matchingWindows).Count): $titles"
}
$window = @($matchingWindows)[0]

$dpi = [KamiReaderWindowCapture]::GetDpiForWindow($window.Handle)
if ($dpi -lt 96) {
  throw "GetDpiForWindow returned an invalid DPI value: $dpi."
}
$deviceScaleFactor = $dpi / 96

$rect = [KamiReaderWindowCapture+Rect]::new()
if (-not [KamiReaderWindowCapture]::GetWindowRect($window.Handle, [ref]$rect)) {
  throw "GetWindowRect failed for the Obsidian fixture window."
}

$rasterWidth = $rect.Right - $rect.Left
$rasterHeight = $rect.Bottom - $rect.Top
if ($rasterWidth -le 0 -or $rasterHeight -le 0) {
  throw "Obsidian reported an invalid window size: ${rasterWidth}x${rasterHeight}."
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$outputExtension = [System.IO.Path]::GetExtension($resolvedOutput).ToLowerInvariant()
if ($outputExtension -notin ".jpg", ".jpeg", ".png") {
  throw "Visual evidence must be saved as .jpg, .jpeg, or .png."
}
$outputDirectory = [System.IO.Path]::GetDirectoryName($resolvedOutput)
[System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null

$bitmap = [System.Drawing.Bitmap]::new($rasterWidth, $rasterHeight)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$deviceContext = [IntPtr]::Zero
try {
  $deviceContext = $graphics.GetHdc()
  if (-not [KamiReaderWindowCapture]::PrintWindow($window.Handle, $deviceContext, 2)) {
    throw "PrintWindow failed for the Obsidian fixture window."
  }
  $graphics.ReleaseHdc($deviceContext)
  $deviceContext = [IntPtr]::Zero
  $imageFormat = if ($outputExtension -eq ".png") {
    [System.Drawing.Imaging.ImageFormat]::Png
  } else {
    [System.Drawing.Imaging.ImageFormat]::Jpeg
  }
  $bitmap.Save($resolvedOutput, $imageFormat)
} finally {
  if ($deviceContext -ne [IntPtr]::Zero) {
    $graphics.ReleaseHdc($deviceContext)
  }
  $graphics.Dispose()
  $bitmap.Dispose()
}

[pscustomobject]@{
  path = $resolvedOutput
  rasterWidth = $rasterWidth
  rasterHeight = $rasterHeight
  viewportWidth = [Math]::Round($rasterWidth / $deviceScaleFactor)
  viewportHeight = [Math]::Round($rasterHeight / $deviceScaleFactor)
  dpi = $dpi
  deviceScaleFactor = $deviceScaleFactor
  processId = $window.ProcessId
  title = $window.Title
  fixtureVault = $FixtureVaultName
}
