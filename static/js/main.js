var x = document.getElementById("code_area");

var editor = CodeMirror.fromTextArea(x, {
	lineNumbers: true,
	styleActiveLine: true,
	matchBrackets: true,
	tabSize: 4,
	mode: "text/x-csrc"
});

editor.setSize(null, 600);

var theme_select = document.getElementById("theme_select");

function selectTheme() {
	var theme = theme_select.options[theme_select.selectedIndex].innerHTML;
	editor.setOption("theme", theme);
}
