param(
 [Parameter(Mandatory=$true)][string]$Deck,
 [Parameter(Mandatory=$true)][string]$OutDir
)
$ErrorActionPreference='Stop'
$deckPath=(Resolve-Path -LiteralPath $Deck).Path
$renderDirectory=[System.IO.Path]::GetFullPath($OutDir)
New-Item -ItemType Directory -Force -Path $renderDirectory | Out-Null
$application=New-Object -ComObject PowerPoint.Application
$presentation=$null
try {
 $presentation=$application.Presentations.Open($deckPath,$true,$false,$false)
 for($i=1;$i -le $presentation.Slides.Count;$i++) {
  $slidePath=Join-Path $renderDirectory ('slide-{0:D2}.png' -f $i)
  $presentation.Slides.Item($i).Export($slidePath,'PNG',1600,900)
 }
 Write-Output ('Rendered {0} slides' -f $presentation.Slides.Count)
} finally {
 if($presentation) {$presentation.Close()}
 $application.Quit()
 [System.Runtime.InteropServices.Marshal]::ReleaseComObject($application) | Out-Null
}
