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

function write_file(path, data) {
    fs.writeFileSync(path, data);
};

function read_file(path) {
    return fs.readFileSync(path, 'utf8');
};

function read_directory(path) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

function get_filename(filePath) {
    const base_name = path.basename(filePath);
    const filename = path.parse(base_name).name;
    return filename;
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
            
            // inline comments
            if (/^\/\/[^\n]*$/.test(word)) {
                return {
                    token: "comment",
                    value: word
                }
            }

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
            case "control-keyword":
            case "numerical-literal":
            case "text-literal":
            case "custom-type":
            case "enum-type":
                if(replaced.value.slice(-1) == "(") {
                    return `<span class="${replaced.token}">${replaced.value.substr(0, replaced.value.length - 1)}</span><span class="operator">(</span>`;
                }
                return `<span class="${replaced.token}">${replaced.value}</span>`;
            case "function-name":
                return `<span class="function-name">${replaced.value.substr(0, replaced.value.length - 1)}</span><span class="operator">(</span>`;
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

    result += `<div class="code-block">`

    // line indices
    result += `<div class="code-block-line-indices">`

    trimmed_lines.forEach((line, i) => {
        result += `<div>${i + 1}</div>`;
    })

    result += "</div>"

    result += `<div class="code-block-scroll-view">`
    
    // code block
    result += `<div class="code-block-code">`

    trimmed_lines.forEach((line, i) => {
        result += `<div class="code-block-line-parent"><div class="code-block-line">${line}</div></div>`;
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
    if(content.length == 0) {
        return "";
    }
    
    return `<div class="text">${content}</div>`;
}

function create_numbered_list(content) {
    return `<ol>\n${content}</ol>\n`;
}

function create_unordered_list(content) {
    return `<ul>\n${content}</ul>\n`;
}

function create_segment(content) {
    return `<div class="text segment">${content}</div>`;
}


function parse(content) {
    let result = "";

    const heading_1_regex = /^# (.+)/;
    const heading_2_regex = /^## (.+)/;
    const link_regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const code_block_start_regex = /^```/;
    const inline_code_regex = /`([^`]+)`/g;
    const bold_regex = /\*\*(.*?)\*\*|__(.*?)__/g;
    const italics_regex = /\*(.*?)\*|_(.*?)_/g;
    const numbered_list_item_regex = /^\d+\. (.+)/;
    const unordered_list_item_regex = /^[*-] (.+)/;
    const segment_start_regex = /^{{segment}}/;
    const segment_end_regex = /^{{endsegment}}/;

    const lines = content.split('\n');

    let in_code_block = false;
    let code_block_content = '';
    let in_numbered_list = false;
    let in_unordered_list = false;
    let list_content = '';
    let in_segment = false;
    let segment_content = '';

    lines.forEach(line => {
        if (in_segment) {
            if (line.match(segment_end_regex)) {
                in_segment = false;
                result += create_segment(parse(segment_content));
                segment_content = '';
            } else {
                segment_content += line + '\n';
            }
        } else if (in_code_block) {
            if (line.match(code_block_start_regex)) {
                in_code_block = false;
                result += create_code_block(code_block_content);
                code_block_content = '';
            } else {
                code_block_content += line + '\n';
            }
        } else {
            let match;
            if (line.match(segment_start_regex)) {
                in_segment = true;
            } else if (line.match(code_block_start_regex)) {
                in_code_block = true;
            } else if (match = line.match(heading_1_regex)) {
                result += create_header_primary(match[1]);
            } else if (match = line.match(heading_2_regex)) {
                result += create_header_secondary(match[1]);
            } else if (match = line.match(numbered_list_item_regex)) {
                if (!in_numbered_list) {
                    if (in_unordered_list) {
                        result += create_unordered_list(list_content);
                        in_unordered_list = false;
                    }
                    in_numbered_list = true;
                    list_content = '';
                }
                list_content += `<li>${parse(match[1])}</li>\n`;
            } else if (match = line.match(unordered_list_item_regex)) {
                if (!in_unordered_list) {
                    if (in_numbered_list) {
                        result += create_numbered_list(list_content);
                        in_numbered_list = false;
                    }
                    in_unordered_list = true;
                    list_content = '';
                }
                list_content += `<li>${parse(match[1])}</li>\n`;
            } else {
                if (in_numbered_list) {
                    result += create_numbered_list(list_content);
                    in_numbered_list = false;
                }
                if (in_unordered_list) {
                    result += create_unordered_list(list_content);
                    in_unordered_list = false;
                }
                let replaced_content = line.replace(link_regex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
                replaced_content = replaced_content.replace(inline_code_regex, '<code>$1</code>');
                replaced_content = replaced_content.replace(bold_regex, '<strong>$1$2</strong>');
                replaced_content = replaced_content.replace(italics_regex, '<em>$1$2</em>');
                result += create_paragraph(replaced_content);
            }
        }
    });

    if (in_code_block) {
        result += create_code_block(code_block_content);
    }

    if (in_numbered_list) {
        result += create_numbered_list(list_content);
    }

    if (in_unordered_list) {
        result += create_unordered_list(list_content);
    }

    return result;
}

function generate_page(source_file, destination_directory) {
    console.log(`parsing ${source_file}`);

    const content_md = read_file(source_file);
    const content = parse(content_md);
    const page_name = get_filename(source_file);

    const page = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="source/style/common.css">
            <title>${page_name}</title>
        </head>
        <body>
            <div id="header"></div>
            <div id="content">${content}</div>
            <div id="footer">
                <div id="footer-content" class="tertiary-text">
                    <p>
                        <a href="./main.html">Home</a> | 
                        <a href="./blog.html">Blog</a> | 
                        <a href="mailto: simontupy64@gmail.com">Email</a> |
                        <a href="https://discord.gg/rFFQSqBZ">Discord</a> | 
                        <a href="https://twitter.com/goubermouche">Twitter</a> | 
                        <a href="https://github.com/Goubermouche">GitHub</a> 
                    </p>
                    <p>
                        &copy; 2024 goubermouche.com 
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    const page_file = path.join(destination_directory, `${page_name}.html`);
    console.log(`writing ${page_file}`);

    write_file(page_file, page)
}

function main() {
    const source_directory = path.join(__dirname, '../content');
    const destination_directory = path.join(__dirname, '../../');

    read_directory(source_directory)
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