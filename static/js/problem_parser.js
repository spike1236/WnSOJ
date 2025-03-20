document.addEventListener('DOMContentLoaded', function() {
    marked.setOptions({
        renderer: new marked.Renderer(),
        gfm: true,
        breaks: true,
        sanitize: false,
        smartLists: true,
        smartypants: false
    });
    const problemDescription = document.getElementById('problem-description');
    if (problemDescription) {
        const originalContent = problemDescription.innerHTML;
        const parsedContent = marked.parse(originalContent);
        problemDescription.innerHTML = parsedContent;
        renderMathInElement(problemDescription, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                // {left: "\\(", right: "\)", display: false},
                // {left: '\[', right: '\]', display: true}
            ],
            throwOnError: false
        });
    }
});