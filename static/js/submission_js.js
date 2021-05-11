var x = document.getElementById("code_area");
var theme_select = document.getElementById("theme_select");
var lang = document.getElementById("code_language").innerHTML;

var editor = CodeMirror.fromTextArea(x, {
	lineNumbers: true,
	styleActiveLine: true,
	matchBrackets: true,
	readOnly: true,
	tabSize: 4,
	theme: "default",
	mode: ((lang == 'GNU C++14') ? "text/x-c++src" : "text/x-python")
});

editor.setSize(null, 600);
editor.refresh();

function setAutoRefresh() {
    editor.setOption("autoRefresh", true);
}

function selectTheme() {
	var theme = theme_select.options[theme_select.selectedIndex].innerHTML;
	editor.setOption("theme", theme);
}

function copyCode(element) {
    var $temp = $("<textarea>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
    document.getElementById('copy_button').innerHTML = "Copied";
    $(element).toggleClass('btn-outline-dark');
    $(element).toggleClass('btn-dark');
}