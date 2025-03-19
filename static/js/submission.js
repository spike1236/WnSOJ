let codeElement = document.getElementById("code_area");
let themeSelect = document.getElementById("theme_select");
let langElement = document.getElementById("code_language");
let lang = langElement ? langElement.innerHTML : 'GNU C++17';

let editor = CodeMirror.fromTextArea(codeElement, {
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    // readOnly: true,
    tabSize: 4,
    indentUnit: 4,
    theme: "default",
    mode: (lang === 'GNU C++17') ? "text/x-c++src" : "text/x-python",
    lineWrapping: true,
    viewportMargin: Infinity,
    autoRefresh: true
});

editor.setSize("100%", "auto");

// Force refresh when document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        editor.refresh();
    }, 100);
});

function selectTheme() {
    let theme = themeSelect.value;
    editor.setOption("theme", theme);
    editor.refresh();
}

function toggleSolution() {
    const solutionContent = document.getElementById('solution_content');
    const toggleButton = document.getElementById('toggle_solution');

    if (solutionContent.classList.contains('show')) {

        solutionContent.classList.remove('show');
        toggleButton.innerHTML = '<i class="bi bi-chevron-down"></i> Show Solution';
        toggleButton.setAttribute('aria-expanded', 'false');
    } else {

        solutionContent.classList.add('show');
        toggleButton.innerHTML = '<i class="bi bi-chevron-up"></i> Hide Solution';
        toggleButton.setAttribute('aria-expanded', 'true');

        setTimeout(() => {
            editor.refresh();
        }, 350); 
    }
}

function setAutoRefresh() {
    editor.setOption("autoRefresh", true);
    setTimeout(function() {
        editor.refresh();
    }, 10);
}

let copyInProgress = false;
let copyTimeout = null;

function copyCode(editor) {

    if (copyInProgress) return;

    const copyButton = document.getElementById('copy_button');
    const originalText = copyButton.innerHTML;
    const originalClass = 'btn-outline-dark';
    const successClass = 'btn-success';
    const errorClass = 'btn-danger';

    if (editor) {

        copyInProgress = true;

        if (copyTimeout) {
            clearTimeout(copyTimeout);
        }

        const code = editor.getValue();
        navigator.clipboard.writeText(code)
            .then(() => {

                copyButton.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
                copyButton.classList.remove(originalClass, errorClass);
                copyButton.classList.add(successClass);

                copyTimeout = setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.classList.remove(successClass);
                    copyButton.classList.add(originalClass);
                    copyInProgress = false;
                    copyTimeout = null;
                }, 2000);
            })
            .catch((error) => {

                console.error('Failed to copy: ', error);
                copyButton.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Failed!';
                copyButton.classList.remove(originalClass, successClass);
                copyButton.classList.add(errorClass);

                copyTimeout = setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.classList.remove(errorClass);
                    copyButton.classList.add(originalClass);
                    copyInProgress = false;
                    copyTimeout = null;
                }, 2000);
            });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setAutoRefresh();

    const langBadge = document.getElementById('code_language_badge');
    if (langBadge && langElement) {
        langBadge.textContent = langElement.innerHTML;
    }
});