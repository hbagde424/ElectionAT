# PowerShell script to fix division model imports

$controllers = @(
    "assemblyVotesController.js",
    "boothDemographicsController.js", 
    "boothSurveyController.js",
    "boothVolunteersController.js",
    "boothVotesController.js",
    "casteListController.js",
    "codingController.js",
    "electionTypeController.js",
    "eventController.js",
    "genderController.js",
    "governmentController.js",
    "hierarchyController.js",
    "parliamentVotesController.js",
    "userController.js",
    "votingTrendsController.js",
    "workStatusController.js",
    "winningCandidateController.js",
    "winningPartyController.js",
    "visitController.js",
    "partyActivityController.js"
)

Set-Location "d:\ElectionAT\Backend\controllers"

foreach ($controller in $controllers) {
    if (Test-Path $controller) {
        Write-Host "Fixing $controller"
        $content = Get-Content $controller -Raw
        $content = $content -replace "require\('\.\./models/division'\)", "require('../models/Division')"
        Set-Content -Path $controller -Value $content -NoNewline
    }
}

Write-Host "Done fixing division imports!"
