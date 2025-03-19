let solutionCodeArea = document.getElementById("code_area");
let solutionThemeSelect = document.getElementById("solution_theme_select");
let solutionEditor;

// Initialize CodeMirror editor
if (solutionCodeArea) {
    solutionEditor = CodeMirror.fromTextArea(solutionCodeArea, {
        lineNumbers: true,
        styleActiveLine: true,
        matchBrackets: true,
        tabSize: 4,
        indentUnit: 4,
        theme: "default",
        mode: "text/x-c++src",
        lineWrapping: true,
        viewportMargin: Infinity,
        autoRefresh: true
    });

    solutionEditor.setSize("100%", "auto");
    
    // Force refresh when document is fully loaded
    setTimeout(() => solutionEditor.refresh(), 100);

    // Ensure the textarea gets updated with editor content
    solutionEditor.on("change", function() {
        solutionCodeArea.value = solutionEditor.getValue();
    });
}

// Handle form submission to sync CodeMirror content with textarea
document.addEventListener('DOMContentLoaded', function() {
    const problemForm = document.querySelector('.problem-form');
    if (problemForm) {
        problemForm.addEventListener('submit', function(e) {
            if (solutionEditor) {
                // Sync editor content to the original textarea before submission
                solutionCodeArea.value = solutionEditor.getValue();
            }
        });
    }
});

// Theme selection
function selectSolutionTheme() {
    if (solutionEditor && solutionThemeSelect) {
        let theme = solutionThemeSelect.value;
        solutionEditor.setOption("theme", theme);
        solutionEditor.refresh();
    }
}
