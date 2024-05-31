const fs = require('fs');
const path = require('path');

function escape_reg_exp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function is_composed_of(input, elements) {
    const escaped_elements = elements.map(escape_reg_exp).join('|');
    const regex = new RegExp(`^(${escaped_elements})+$`);
    return regex.test(input);
}

function create_code_block(code) {
    let result = "";

    const control_keywords = [
        "if", "else", "switch", "case", 
        "default", "do", "while", "for", 
        "break", "continue", "return",
        "goto", "try", "catch", "throw"
    ];
    
    const type_keywords = [
        "bool", "char", 
        "short", "int", "long", "signed",
        "unsigned", "float", "double", 
        "void", "auto", "decltype", "const",
        "volatile", "mutable", "static",
        "extern", "register", "thread_local",
        "namespace", "using", "class",
        "struct", "union", "friend",
        "public", "private", "protected",
        "public", "virtual", "explicit",
        "final", "override", "sizeof",
        "alignof", "new", "delete",
        "co_await", "co_return", "co_yield",
        "static_cast", "dynamic_cast",
        "const_cast", "reinterpret_cast",
        "and", "and_eq", "bitand",
        "bitor", "not", "not_eq", "or",
        "or_eq", "xor", "xor_eq", "compl",
        "asm", "static_assert", "noexcept",
        "nullptr", "typeid", "typedef",
        "requires", "concept", "alignas",
        "consteval", "constexpr", "constinit",
        "import", "module", "reflexpr",
        "synchronized", "enum", "template",
        "typename"
    ];

    const operators = [
        '>', '<',',', '{', '}', '(', ')', '+', '-', 
        '*', '/', '%', '++', '--', '==', '!=', '<=',
        '>=', '&&', '||', '!', '&', '|', '^', '~',
        '<<', '>>', '+=', '-=', '*=', '/=', '%=',
        '&=', '|=', '^=', '<<=', '>>=', '->', '.',
        '->*', '.*', '::', ';', '[', ']'
    ];

    const regex = /(\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b|\b\d+(\.\d+)?([fF])?\b|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\w+\s*\(|\/\/[^\n]*|#include\s*<[^>]+>|#include\s*"[^"]+"|\w+|\s+|[^\s\w]+)/g;
    const words = code.match(regex);

    let custom_type_names = [
        "size_t", "char8_t",  "char16_t",
        "char32_t", "wchar_t", "int8_t", 
        "int16_t", "int32_t", "int64_t",
        "uint8_t", "uint16_t", "uint32_t",
        "uint64_t"
    ];

    let enum_type_names = [];

    function detect_custom_types(code) {
        const custom_type_regex = /\b(class|struct|typename|enum)\s+(\w+)/g;
        const keywords = new Set(['class', 'struct', 'typename', 'enum']);
        let match;

        while ((match = custom_type_regex.exec(code)) !== null) {
            const keyword = match[1];
            const typename = match[2];

            if (!keywords.has(typename)) {
                custom_type_names.push(typename);
            } else {
                // if the typename is a keyword, restart the regex from the current match index
                custom_type_regex.lastIndex = match.index + keyword.length;
            }
        }
    }

    function detect_enum_types(code) {
        const enum_type_regex = /\b(enum|enum\s+class)\s+\w+\s*\{([^}]*)\}/g;
        let match;

        while ((match = enum_type_regex.exec(code)) !== null) {
            const members = match[2].split(',').map(member => member.trim());

            members.forEach(member => {
                enum_type_names.push(member)
            })
        }
    }

    detect_custom_types(code);
    detect_enum_types(code);

    const replaced_words = words.map(word => {
        function replace_word(word) {
            const stripped_word = word.match(/\w+/) ? word.match(/\w+/)[0] : "";
    
            // control keywords
            if (control_keywords.includes(stripped_word)) {
                return {
                    token: "control-keyword",
                    value: word
                }
            }
    
            // type keywords
            if(type_keywords.includes(stripped_word)) {
                return {
                    token: "type-keyword",
                    value: word
                }
            }
    
            // string literals
            if (/^"(?:\\.|[^"\\])*"$/.test(word)) {
                return {
                    token: "text-literal",
                    value: word
                }
            }
    
            // char literals
            if (/^'(?:\\.|[^'\\])'$/.test(word)) {
                return {
                    token: "text-literal",
                    value: word
                }
            }
    
            // hex literals
            if (/\b0[xX][0-9a-fA-F]+\b/.test(word)) {
                return {
                    token: "numerical-literal",
                    value: word
                }
            }
        
            // binary literals
            if (/\b0[bB][01]+\b/.test(word)) {
                return {
                    token: "numerical-literal",
                    value: word
                }
            }
        
            // floating point literals
            if (/\b\d+(\.\d+)?([fF])?\b/.test(word)) {
                return {
                    token: "numerical-literal",
                    value: word
                }
            }
    
            // function declarations and calls
            if (/\w+\s*\($/.test(word)) {
                return {
                    token: "function-name",
                    value: word
                }
            }

            // inline comments
            if (/^\/\/[^\n]*$/.test(word)) {
                return {
                    token: "comment",
                    value: word
                }
            }
    
            // include directives
            if (/^#include\s*<[^>]+>$/.test(word) || /^#include\s*"[^"]+"$/.test(word)) {
                const parts = word.match(/(#include)\s*(<[^>]+>|"[^"]+")/);
                return {
                    token: "include",
                    value: [parts[1], parts[2].replace(/</g, "&lt;").replace(/>/g, "&gt;")]
                }
            }
    
            // custom type names
            if(custom_type_names.includes(stripped_word)) {
                return {
                    token: "custom-type",
                    value: word
                }
            }

            // enum type names
            if(enum_type_names.includes(stripped_word)) {
                return {
                    token: "enum-type",
                    value: word
                }
            }

            // fallback to identifiers
            return {
                token: undefined,
                value: word
            };
        }

        const replaced = replace_word(word);

        // identifiers
        if(replaced.token === undefined) {
            // identifiers can be composed only from operators, if this occurs we need to treat them as such
            if(is_composed_of(replaced.value, operators)) {
                return `<span class="operator">${replaced.value}</span>`
            }

            return replaced.value;
        }

        // special cases for classified tokens
        switch(replaced.token)  {
            case "comment":
            case "type-keyword":
            case "numerical-literal":
            case "text-literal":
            case "custom-type":
            case "enum-type":
                return `<span class="${replaced.token}">${replaced.value}</span>`;
            case "function-name":
                return `<span class="function-name">${replaced.value.substr(0, replaced.value.length - 1)}</span><span class="operator">(</span>`;
            case "control-keyword": {
                if(replaced.value.slice(-1) == "(") {
                    return `<span class="control-keyword">${replaced.value.substr(0, replaced.value.length - 1)}</span><span class="operator">(</span>`;
                }
                return `<span class="control-keyword">${replaced.value}</span>`;
            }
            case "include": {
                return `<span class="include-keyword">${replaced.value[0]}</span> <span class="include-path">${replaced.value[1]}</span>`;
            }
        }

        return replaced;
    });

    const lines = replaced_words.join('').split(/\r?\n/);
    const first_non_empty_index = lines.findIndex(line => line.trim() !== '');
    const last_non_empty_index = lines.length - 1 - lines.slice().reverse().findIndex(line => line.trim() !== '');
    const trimmed_lines = lines.slice(first_non_empty_index, last_non_empty_index + 1);

    result += `<div class="holder code">`

    // lines
    result += `<div class="lines">`

    trimmed_lines.forEach((line, i) => {
        result += `<div class="lines-index">${i + 1}</div>`;
    })

    result += "</div>"

    // scrollable
    result += `<div class="scrollable">`
    
    // code
    result += `<div class="codes">`

    trimmed_lines.forEach((line, i) => {
        result += `<div class="code-line-parent"><div class="code-line">${line}</div></div>`;
    })

    result += "</div>"
    result += "</div>"
    result += "</div>"

    return result;
}

function create_header_primary(content) {
    return `<h1 class="text">${content}</h1>`;
}

function create_header_secondary(content) {
    return `<h2 class="text">${content}</h1>`;
}

function create_paragraph(content) {
    return `<div class="text">${content}</div>`;
}

function parse(content) {
    let result = "";

    const heading1Regex = /^# (.+)/;
    const heading2Regex = /^## (.+)/;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const codeBlockStartRegex = /^```/;
    const inlineCodeRegex = /`([^`]+)`/g;

    // Split the content by lines
    const lines = content.split('\n');

    let inCodeBlock = false;
    let codeBlockContent = '';

    lines.forEach(line => {
        if (inCodeBlock) {
            if (line.match(codeBlockStartRegex)) {
                inCodeBlock = false;
                result += create_code_block(codeBlockContent);
                codeBlockContent = '';
            } else {
                codeBlockContent += line + '\n';
            }
        } else {
            let match;
            if (line.match(codeBlockStartRegex)) {
                inCodeBlock = true;
            } else if (match = line.match(heading1Regex)) {
                result += create_header_primary(match[1]);
            } else if (match = line.match(heading2Regex)) {
                result += create_header_secondary(match[1]);
            } else {
                // Replace links and inline code in the paragraph
                let replacedContent = line.replace(linkRegex, '<a href="$2">$1</a>');
                replacedContent = replacedContent.replace(inlineCodeRegex, '<code>$1</code>');
                result += create_paragraph(replacedContent);
            }
        }
    });

    // Handle the case where the content ends while still inside a code block
    if (inCodeBlock) {
        create_code_block(codeBlockContent);
    }

    return result;
}

function writeFile(filePath, data) {
    fs.writeFileSync(filePath, data);
};

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
};

function readDirectory(directoryPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

function getFilenameWithoutExtension(filePath) {
    const baseName = path.basename(filePath);
    const fileName = path.parse(baseName).name;
    return fileName;
}

function generate_page(source_file, destination_directory) {
    console.log(`parsing ${source_file}`);

    const content_md = readFile(source_file);
    const content = parse(content_md);
    const page_name = getFilenameWithoutExtension(source_file);

    const page = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="source/style/utilities.css">
            <title>${page_name}</title>
        </head>
        <body>
            <div id="main">
            <div id="header"></div>
            <div id="content">${content}</div>
            <div id="footer"></div>
        </body>
        </html>
    `;

    const page_file = path.join(destination_directory, `${page_name}.html`);
    console.log(`writing ${page_file}`);

    writeFile(page_file, page)
}

function main() {
    const source_directory = path.join(__dirname, '../content');
    const destination_directory = path.join(__dirname, '../../');

    readDirectory(source_directory)
        .then(files => {
            files.forEach(file => {
                generate_page(path.join(source_directory, file), destination_directory);
            })
        })
        .catch(err => {
            console.error('error reading directory:', err);
        });
}

main();