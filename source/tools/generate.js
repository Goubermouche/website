const { captureRejectionSymbol } = require('events');
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

function write_file(filepath, data) {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, data);
}

function read_file(path) {
    return fs.readFileSync(path, 'utf8');
};

async function read_directory_rec(directory_path, relativePath) {
    const entries = await fs.promises.readdir(directory_path, { withFileTypes: true });

    const files = await Promise.all(entries.map(async (entry) => {
        const full = path.join(directory_path, entry.name);
        const rel = path.join(relativePath, entry.name);
        if (entry.isDirectory()) {
            return read_directory_rec(full, rel);
        } else {
            return rel;
        }
    }));

    return Array.prototype.concat(...files);
}

function read_directory(directory_path) {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await read_directory_rec(directory_path, '');
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

function get_folder_depth(filepath) {
    const segments = filepath.split(path.sep);
    const non_empty = segments.filter(segment => segment.length > 0);
    return non_empty.length - 1;
}

function get_filename(filePath) {
    const base_name = path.basename(filePath);
    const filename = path.parse(base_name).name;
    return filename;
}

function format_document_heading(input) {
    if(input == "index") {
        return "Goubermouche";
    }

    let words = input.split('-');
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    let result = words.join(' ');
    return result;
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
        '>', '<', ',', '{', '}', '(', ')', '+', '-',
        '*', '/', '%', '++', '--', '==', '!=', '<=',
        '>=', '&&', '||', '!', '&', '|', '^', '~',
        '<<', '>>', '+=', '-=', '*=', '/=', '%=',
        '&=', '|=', '^=', '<<=', '>>=', '->', '.',
        '->*', '.*', '::', ';', '[', ']'
    ];

    const regex = /(\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b|\b\d+(\.\d+)?([fF])?\b|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\w+\s*\(|\/\/[^\n]*|#include\s*<[^>]+>|#include\s*"[^"]+"|\w+|\s+|[^\s\w]+)/g;
    const words = code.match(regex);

    let custom_type_names = [
        "size_t", "char8_t", "char16_t",
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
            if (type_keywords.includes(stripped_word)) {
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
            if (custom_type_names.includes(stripped_word)) {
                return {
                    token: "custom-type",
                    value: word
                }
            }

            // enum type names
            if (enum_type_names.includes(stripped_word)) {
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
        if (replaced.token === undefined) {
            // identifiers can be composed only from operators, if this occurs we need to treat them as such
            if (is_composed_of(replaced.value, operators)) {
                return `<span class="operator">${replaced.value}</span>`
            }

            return replaced.value;
        }

        // special cases for classified tokens
        switch (replaced.token) {
            case "comment":
            case "type-keyword":
            case "control-keyword":
            case "numerical-literal":
            case "text-literal":
            case "custom-type":
            case "enum-type":
                if (replaced.value.slice(-1) == "(") {
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

function generate_page(source_file, source_directory, destination_directory) {
    const full_path = path.join(source_directory, source_file);

    console.log(`parsing ${full_path}`);

    const page_name = get_filename(source_file);
    const t = new tokenizer();
    const p = new parser();

    const content_md = read_file(full_path);
    const tokens = t.tokenize(content_md);

    try {
        const content = p.parse(tokens);
        const style_path = `./${"../".repeat(get_folder_depth(source_file))}/source/style/common.css`;

        const page = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="${style_path}">
                <link rel="icon" type="image/x-icon" href="/source/data/favicon.ico">
                <title>${format_document_heading(page_name)}</title>
            </head>
            <body>
                <div id="header"></div>
                <div id="content">${content}</div>
                <div id="footer">
                    <div id="footer-content">
                        <div id="footer-links">
                            <a href="/index.html">Home</a> | 
                            <a href="/blog.html">Blog</a> | 
                            <a href="mailto: simontupy64@gmail.com">Email</a> |
                            <a href="https://twitter.com/goubermouche">Twitter</a> | 
                            <a href="https://github.com/Goubermouche">GitHub</a> 
                        </div>
                        <div id="footer-parsed-time">
                            <span id="parsed_time"></span>
                        </div>
                        <div id="footer-copyright">
                            &copy; 2024 goubermouche.com 
                        </div>
                    </div>
                </div>
                <script>
                onload = () => {
                    const parsed_date_string = "Sun Jun 02 2024 13:35:43 GMT+0200 (Central European Summer Time)";
                    const parsed_date = new Date(parsed_date_string);
                    const current_date = new Date();

                    const difference_in_milliseconds = current_date - parsed_date;
                    const difference_in_days = difference_in_milliseconds / (1000 * 60 * 60 * 24);

                    document.getElementById("parsed_time").innerHTML = \`Updated \${difference_in_days.toFixed(2)} days ago\`;
                    for (let table of document.querySelectorAll("table")) {
                        for (let row of table.children[0].children) {
                            let min_height = Number.MAX_SAFE_INTEGER;

                            for (let element of row.children) {
                                const element_value = element.children[0];
                                min_height = Math.min(element_value.offsetHeight, min_height);
                            }

                            console.log(min_height)

                            let widths = [];
                            let i = 0;

                            for (let element of row.children) {
                                element.children[0].style.height = \`\${min_height}px\`;

                                widths.push({
                                    element: element,
                                    width: element.children[0].scrollWidth,
                                    index: i
                                });

                                ++i;
                            }


                            let total = row.offsetWidth - ((row.children.length - 1) * 10)
                            let percent = total / 100;
                            let total_percent

                            widths.sort((a, b) => a.width - b.width);

                            console.log(widths)


                            for (let i = 0; i < widths.length; ++i) {
                                const element = widths[i];
                                const width_percent = element.width / percent;

                                if (total - element.width > 0) {
                                    if (i + 1 >= widths.length) {
                                        element.element.style.width = \`auto\`;
                                    }
                                    else if (element.index === 0) {
                                        element.element.style.width = \`\${element.width}px\`;
                                    }
                                    else {
                                        element.element.style.width = \`\${element.width}px\`;
                                    }

                                    total -= element.width;
                                } else {
                                    element.element.style.width = \`auto\`;
                                }
                            }

                            for (let i = 0; i < row.children.length; ++i) {
                                let element = row.children[i];

                                if (i === 0) {

                                }
                                else {
                                    element.style.paddingLeft = "10px"
                                }
                            }
                        }
                    }
                }
                </script>
            </body>
            </html>
        `;
    
        const page_file = path.join(destination_directory, source_file.replace(".md", ".html"));
        console.log(`writing ${page_file}`);
    
        write_file(page_file, page)
    }
    catch(error){
        console.error(error);
    }
}

const token_type = Object.freeze({
    hashtag:           "hashtag",           // #
    backtick:          "backtick",          // `
    left_parenthesis:  "left_parenthesis",  // (
    right_parenthesis: "right_parenthesis", // )
    left_bracket:      "left_bracket",      // [
    right_bracket:     "right_bracket",     // ]
    left_brace:        "left_brace",        // {
    right_brace:       "right_brace",       // }
    vertical_bar:      "vertical_bar",      // |
    text:              "text",              
    dollar_sign:       "dollar_sign",       // $   
    exclamation_mark:  "exclamation_mark",  // !      
    asterisk:          "asterisk",          // *     
    dash:              "dash",              // -    
    newline:           "newline",           // \n  
});

class tokenizer {
    tokenize(string) {
        const special_chars = new Map([
            ["#", token_type.hashtag],
            ["`", token_type.backtick],
            ["(", token_type.left_parenthesis],
            [")", token_type.right_parenthesis],
            ["[", token_type.left_bracket],
            ["]", token_type.right_bracket],
            ["{", token_type.left_brace],
            ["}", token_type.right_brace],
            ["|", token_type.vertical_bar],
            ["$", token_type.dollar_sign],
            ["!", token_type.exclamation_mark],
            ["*", token_type.asterisk],
            ["-", token_type.dash],
            ["\n", token_type.newline],
        ]);

        let current_index = 0;
        let current_text = "";
        let tokens = [];

        function push_text() {
            if(current_text == "") {
                return;
            }

            tokens.push({
                type: token_type.text,
                value: current_text
            });
            
            current_text = "";
        }

        while(current_index != string.length) {
            const current_char = string[current_index++];

            if(current_char == '\r') {
                continue;
            }

            if(special_chars.has(current_char)) {
                push_text();

                tokens.push({
                    type: special_chars.get(current_char),
                    value: current_char
                })
            }
            else {
                current_text += current_char;
            }
        }

        if(current_text != "") {
            push_text();
        }

        return tokens;
    }
}

class parser {
    parse(tokens) {
        let current_token;
        let index = 0;

        function peek_next() {
            return tokens[index + 1].type;
        }

        function next() {
            index++;
        }

        function expect_current(expected) {
            const current = tokens[index];

            if(current.type != expected) {
                throw new Error(`unexpected token - expected '${expected}', but got '${next.type}'`);
            }

            return current.value;
        }

        function expect_next(expected) {
            index++;
            const next = tokens[index];

            if(next.type != expected) {
                throw new Error(`unexpected token - expected '${expected}', but got '${next.type}'`);
            }

            return next.value;
        }

        function parse_heading() {
            expect_current(token_type.hashtag);

            let level = 1;

            if(peek_next() == token_type.hashtag) {
                level = 2;
                next();
            }

            const contents = expect_next(token_type.text);
            next();

            return `<h${level} class="text">${contents.trim()}</h${level}>\n`;
        }

        function parse_link_contents() {
            let contents = "";
            let address = "";

            expect_current(token_type.left_bracket);

            next();
            contents += tokens[index].value;

            while(true) {
                next();

                if(tokens[index].type === token_type.right_bracket) {
                    break;
                }

                contents += tokens[index].value;
            }

            expect_next(token_type.left_parenthesis);

            next();
            address += tokens[index].value;

            while(true) {
                next();

                if(tokens[index].type === token_type.right_parenthesis) {
                    break;
                }

                address += tokens[index].value;
            }

            next();
            next();

            return {
                address: address,
                contents: contents
            }
        }

        function parse_link() {
            const link = parse_link_contents();
            return `<a href="${link.address}">${link.contents}</a>\n`;
        }

        function parse_view() {
            expect_current(token_type.dollar_sign);
            next();
            const link = parse_link_contents();
            return "";
        }

        function parse_image() {
            expect_current(token_type.exclamation_mark);
            next();
            try {
                const link = parse_link_contents();
                return `<img src="${link.address}" alt="${link.contents}">\n`;
            } catch(error) {
                return "!" + tokens[index].value;
            }
        }

        function parse_code() {
            expect_current(token_type.backtick);
            let content = "";

            if(peek_next() == token_type.backtick) {
                // multiline block
                expect_next(token_type.backtick);
                expect_next(token_type.backtick);
                next();

                while(true) {
                    content += tokens[index].value;

                    if(peek_next() == token_type.backtick) {
                        break;
                    }

                    index++;
                }

                expect_next(token_type.backtick);
                expect_next(token_type.backtick);
                expect_next(token_type.backtick);
                next();
                return `<div>${create_code_block(content)}</div>`;
            }
            else {
                next();

                // inline block
                while(true) {
                    content += tokens[index].value;

                    if(peek_next() == token_type.backtick) {
                        break;
                    }

                    index++;
                }
                next(); // backtick
                next(); // prime next
                return `<code>${content}</code>\n`;
            }
        }

        function consume_whitespace() {
            while(index + 1 < tokens.length && tokens[index].type != token_type.newline && tokens[index].value.trim().length == 0) {
                index++;
            }
        }

        function parse_table() {
            function parse_table_row() {
                let cells = [];

                while(index + 1 < tokens.length) {
                    expect_current(token_type.vertical_bar);
                    next(); // prime next

                    const content = parse_inline();
                    consume_whitespace();

                    if(content.trim().length == 0) {
                        break;
                    }

                    if(tokens[index].type === token_type.newline) {
                        next();
                        break;
                    }

                    cells.push(`<td>${content}</td>`);
                }

                return cells.join("");
            }

            expect_current(token_type.vertical_bar);
            let rows = [];

            while(index + 1 < tokens.length) {
                if(tokens[index].type !== token_type.vertical_bar) {
                    break;
                }

                rows.push(`<tr>${parse_table_row()}</tr>\n`);
            }

            return `<div class="table-container"><table class="table">\n${rows.join("")}</table></div>`;
        }

        function parse_bold_or_italic() {
            expect_current(token_type.asterisk);
            let content = "";

            if(peek_next() == token_type.asterisk) {
                // bold
                next();
                next();

                while(true) {
                    content += tokens[index].value;

                    if(peek_next() == token_type.asterisk) {
                        break;
                    }

                    index++;
                }

                expect_next(token_type.asterisk);
                expect_next(token_type.asterisk);
                next();
                return `<b>${content}</b>\n`;
            }
            else {
                // asterisk
                next();

                while(true) {
                    content += tokens[index].value;

                    if(peek_next() == token_type.asterisk) {
                        break;
                    }

                    index++;
                }
                
                next(); 
                next(); // prime next
                return `<i>${content}</i>\n`;
            }
        }

        function parse_segment() {
            expect_current(token_type.left_brace);
            next();

            let content = "";

            while(index + 1 < tokens.length && tokens[index].type !== token_type.right_brace) {
                content += parse_expression();
            }
           
            next();
            return `<div class="segment">\n${content}</div>\n`
        }

        function skip_newline() {
            while(index < tokens.length && tokens[index].type === token_type.newline) {
                next();
            }
        }

        function parse_list() {
            function parse_list_element() {
                expect_current(token_type.dash);
                next();
                const content = parse_inline();
                return content;
            }

            let list = [];

            while(index < tokens.length && tokens[index].type === token_type.dash) {
                list.push(`<li>${parse_list_element()}</li>`);
            }

            return `<ul>${list.join("\n")}</ul>`;
        }

        function parse_inline() {
            let content = "";
            
            // parses until we reach a newline
            while(index < tokens.length && tokens[index].type !== token_type.newline) {
                current_token = tokens[index];

                switch(current_token.type) {
                    case token_type.hashtag: {
                        content += parse_heading();
                        break;
                    }
                    case token_type.asterisk: {
                        content += parse_bold_or_italic();
                        break;
                    }
                    case token_type.backtick: {
                        content += parse_code();
                        break;
                    }
                    case token_type.left_bracket: {
                        content += parse_link();
                        break;
                    }
                    case token_type.dollar_sign: {
                        content += parse_view();
                        break;
                    }
                    case token_type.exclamation_mark: {
                        content += parse_image();
                        break;
                    }
                    case token_type.vertical_bar: {
                        return content;
                    }
                    default: {
                        content += current_token.value;
                        next();
                        break;
                    }
                }
            }


            next();

            if(content.trim().length == 0) {
                return "";
            }

            return `<div class="text">${content}</div>`;
        }

        function parse_expression() {
            // list
            current_token = tokens[index];

            switch(current_token.type) {
                case token_type.dash: {
                    return parse_list();
                }
                case token_type.left_brace: {
                    return parse_segment();
                } 
                case token_type.vertical_bar: {
                    return parse_table();
                } 
                default: {
                    let res =  parse_inline();
                    return res;
                }
            }
        }

        function parse_top_level() {
            let content = "";

            while(index + 1 < tokens.length) {
                skip_newline();

                if(index + 1 < tokens.length) {
                    content += parse_expression();
                }
            }
    
            return content;
        }

        return parse_top_level();
    }
}

function main() {
    const source_directory = path.join(__dirname, '../content');
    const destination_directory = path.join(__dirname, '../../');

    read_directory(source_directory)
        .then(files => {
            files.forEach(file => {
                generate_page(file, source_directory, destination_directory);
            })
        })
        .catch(err => {
            console.error('error reading directory:', err);
        });

}

main();
