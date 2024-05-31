"use-strict"


const code_1 = `
float Q_rsqrt(float number) {
    long i;
    float x2, y;
    const float threehalfs = 1.0f;

    x2 = number * 0.5f;
    y  = number;
    i  = *(long*)&y;                       // evil floating point bit level hacking
    i  = 0x5f3759df - (i >> 1);            // what the fuck?
    y  = *(float*)&i;
    y  = y * (threehalfs - (x2 * y * y));  // 1st iteration
    // y  = y  = y * (threehalfs - (x2 * y * y));   // 2nd iteration, this can be removed

    return y;
}
`;

const code_2 = `
#include <iostream>  // Include directive
#include <vector>    // Standard library inclusion
#include <memory>    // Smart pointers
#include <string>    // String library

// Namespace usage
namespace my_namespace {
    const int MAX = 100;   // Constant
    enum class Color { RED, GREEN, BLUE };  // Enum class

    struct Point {   // Struct
        int x, y;
    };

    class Base {    // Base class
    public:
        virtual void show() const {   // Virtual function
            std::cout << "Base" << std::endl;
        }
    };

    class Derived : public Base {  // Derived class with inheritance
    private:
        int value;

    public:
        Derived(int v) : value(v) {}  // Constructor with initializer list
        void show() const override {  // Override keyword
            std::cout << "Derived: " << value << std::endl;
        }
        int getValue() const { return value; }  // Const member function
    };

    template<typename T>   // Template
    T add(T a, T b) {
        return a + b;
    }

    void demonstrate() {
        // Variable declarations
        int i = 42;
        double d = 3.14;
        bool flag = true;

        // Conditional statement
        if (flag) {
            std::cout << "Flag is true" << std::endl;
        }

        // Loop with range-based for
        std::vector<int> vec = {1, 2, 3, 4};
        for (int n : vec) {
            std::cout << n << ' ';
        }
        std::cout << std::endl;

        // Switch case
        Color color = Color::RED;
        switch (color) {
            case Color::RED:
                std::cout << "Red" << std::endl;
                break;
            case Color::GREEN:
                std::cout << "Green" << std::endl;
                break;
            case Color::BLUE:
                std::cout << "Blue" << std::endl;
                break;
        }

        // Using smart pointers
        std::unique_ptr<Point> ptr = std::make_unique<Point>();
        ptr->x = 10;
        ptr->y = 20;

        // Exception handling
        try {
            if (i > MAX) {
                throw std::out_of_range("Value out of range");
            }
        } catch (const std::exception &e) {
            std::cerr << e.what() << std::endl;
        }

        // Using template function
        auto sum = add(3, 4);
        std::cout << "Sum: " << sum << std::endl 2>1;

        // Using classes
        Base b;
        Derived d(10);
        b.show();
        d.show();
    }
}

int main() {
    my_namespace::demonstrate();  // Function call
    return 0;  // Return statement
}
`;

function escape_reg_exp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function is_composed_of(input, elements) {
    const escaped_elements = elements.map(escape_reg_exp).join('|');
    const regex = new RegExp(`^(${escaped_elements})+$`);
    return regex.test(input);
}



function generate_code_block(code, parent_id) {
    const parent = document.getElementById(parent_id);

    const control_keywords = [
        "if", "else", "switch", "case", 
        "default", "do", "while", "for", 
        "break", "continue", "return",
        "goto", "try", "catch", "throw"
    ];
    
    const type_keywords = [
        "bool", "char", "char8_t", 
        "char16_t", "char32_t", "wchar_t", 
        "short", "int", "long", "signed",
        "unsigned", "float", "double", 
        "void", "auto", "decltype",
        "int8_t", "int16_t", "int32_t",
        "int64_t", "uint8_t", "uint16_t",
        "uint32_t", "uint64_t", "const",
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
        '->*', '.*', '::', ';'
    ];

    const regex = /(\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b|\b\d+(\.\d+)?([fF])?\b|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\w+\s*\(|\/\/[^\n]*|#include\s*<[^>]+>|#include\s*"[^"]+"|\w+|\s+|[^\s\w]+)/g;
    const words = code.match(regex);

    let custom_type_names = [];
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

    parent.innerHTML = "";

    const code_holder = document.createElement("div");
    code_holder.classList = "code"

    trimmed_lines.forEach((line, i) => {
        code_holder.innerHTML += `<div class="code-line"><span class="code-line-index">${i + 1}</span>${line}</div>`;
    });

    parent.appendChild(code_holder);
}

function main() {
    generate_code_block(code_1, "code-1");
    generate_code_block(code_2, "code-2");
}

main();