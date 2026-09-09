const fs = require('fs');

const css = fs.readFileSync('styles.css', 'utf8');

const regex = /html\.theme-vehicle([^\s{]*\s*[^,{]*)(,|\s*\{)/g;
let newCss = css;

// We want to replace `html.theme-vehicle .my-class {` with `html.theme-vehicle .my-class, html.theme-security .my-class {`
// Be careful with multiple selectors separated by commas.
// It's easier to just duplicate the blocks or add the selector.

let result = css.split('\n').map(line => {
    if (line.includes('html.theme-vehicle ') && !line.includes('html.theme-security')) {
        let replacement = line.replace('html.theme-vehicle ', 'html.theme-security ');
        // If the line already ends with a comma
        if (line.trim().endsWith(',')) {
            return line + '\n' + replacement;
        } else if (line.trim().endsWith('{')) {
            return line.replace('{', ', \n' + replacement.replace('html.theme-security', 'html.theme-security').trim());
        }
    }
    return line;
}).join('\n');

// specifically for lines like `html.theme-vehicle .arch-photo-container {`
// it will become:
// `html.theme-vehicle .arch-photo-container ,`
// `html.theme-security .arch-photo-container {`

// Let's use a regex instead for safer replacement
let finalCss = css.replace(/(html\.theme-vehicle[^{,]*)(,|\s*\{)/g, (match, p1, p2) => {
    // If it's just html.theme-vehicle, add html.theme-security
    const secSelector = p1.replace('theme-vehicle', 'theme-security');
    return `${p1}, ${secSelector}${p2}`;
});

fs.writeFileSync('styles.css', finalCss);
console.log("Replaced successfully!");
