var x = document.getElementById("code_area");
var theme_select = document.getElementById("theme_select");
var language_select = document.getElementById("language");

var editor = CodeMirror.fromTextArea(x, {
	lineNumbers: true,
	styleActiveLine: true,
	matchBrackets: true,
	tabSize: 4,
	mode: "text/x-c++src",
	theme: "default"
});

editor.setSize(null, 600);
editor.refresh()

function setReadOnly() {
    editor.setOption("readOnly", true);
}

function selectTheme() {
	var theme = theme_select.options[theme_select.selectedIndex].innerHTML;
	editor.setOption("theme", theme);
}

function selectLanguage() {
    var language = language_select.options[language_select.selectedIndex].innerHTML;
    if (language == "GNU C++17") {
        editor.setOption("mode", "text/x-c++src");
    } else {
        editor.setOption("mode", "text/x-python");
    }
}
