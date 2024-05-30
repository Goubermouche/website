"use-strict"

const code_1 = `
#include <iostream>  // Include directive
#include <vector>    // Standard library inclusion
#include <memory>    // Smart pointers
#include <string>    // String library

// Namespace usage
namespace my_namespace {
    const int MAX = 100;   // Constant
    enum class Color { RED, GREEN, BLUE };  // Enum class

    struct Point {   // Struct
        int x, y;p
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
        std::cout << "Sum: " << sum << std::endl;

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

const code_2 = `
struct Point {   // Struct
    int x, y;
};
`;

function generate_code_block(code, parent_id) {
    const parent = document.getElementById(parent_id);

    const control_keywords = [
        "if", 
        "else", 
        "switch", 
        "case", 
        "default",
        "do", 
        "while", 
        "for", 
        "break",
        "continue",
        "return",
        "goto", 
        "try", 
        "catch", 
        "throw"
    ];
    
    const type_keywords = [
        "bool", 
        "char", 
        "char8_t", 
        "char16_t", 
        "char32_t",
        "wchar_t", 
        "short", 
        "int", 
        "long",
        "signed",
        "unsigned",
        "float", 
        "double", 
        "void", 
        "auto", 
        "decltype",
        "int8_t",
        "int16_t",
        "int32_t",
        "int64_t",
        "uint8_t",
        "uint16_t",
        "uint32_t",
        "uint64_t",
        "const",
        "volatile",
        "mutable",
        "static",
        "extern",
        "register",
        "thread_local",
        "namespace",
        "using",
        "class",
        "struct",
        "union",
        "friend",
        "public",
        "private",
        "protected",
        "public",
        "virtual",
        "explicit",
        "final",
        "override",
        "sizeof",
        "alignof",
        "new",
        "delete",
        "co_await",
        "co_return",
        "co_yield",
        "static_cast",
        "dynamic_cast",
        "const_cast",
        "reinterpret_cast",
        "and",
        "and_eq",
        "bitand",
        "bitor",
        "not",
        "not_eq",
        "or",
        "or_eq",
        "xor",
        "xor_eq",
        "compl",
        "asm",
        "static_assert",
        "noexcept",
        "nullptr",
        "typeid",
        "typedef",
        "requires",
        "concept",
        "alignas",
        "consteval",
        "constexpr",
        "constinit",
        "import",
        "module",
        "reflexpr",
        "synchronized",
        "enum",
        "template",
        "typename"
    ];
    const regex = /(\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b|\b\d+(\.\d+)?\b|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\w+\s*\(|\/\/[^\n]*|#include\s*<[^>]+>|#include\s*"[^"]+"|\w+|\s+|[^\s\w]+)/g;
const words = code.match(regex);

let customTypeNames = [];

// Function to detect and store custom type names
function detectCustomTypes(code) {
    const customTypeRegex = /\b(class|struct|typename)\s+(\w+)/g;
    const keywords = new Set(['class', 'struct', 'typename']);
    const customTypeNames = [];
    let match;

    while ((match = customTypeRegex.exec(code)) !== null) {
        const keyword = match[1];
        const typeName = match[2];

        if (!keywords.has(typeName)) {
            console.log('Captured type name:', typeName);  // Print the captured type name
            customTypeNames.push(typeName);
        } else {
            // If the typeName is a keyword, restart the regex from the current match index
            customTypeRegex.lastIndex = match.index + keyword.length;
        }
    }

    return customTypeNames;
}


// Call the function to detect custom types
customTypeNames = detectCustomTypes(code);

const replacedWords = words.map(word => {
    const strippedWord = word.match(/\w+/) ? word.match(/\w+/)[0] : "";

    if (control_keywords.includes(strippedWord)) {
        // HACK: control flow keywords sometimes look like a function call, but we don't want to treat them as
        //       such, for this reason we have to check if the token ends with a '(', and if it does we split it.
        if (word.endsWith('(')) {
            return `<span class="control-keyword">${word.substr(0, word.length - 1)}</span><span class="operator">(</span>`;
        }

        return `<span class="control-keyword">${word}</span>`;
    }

    if(type_keywords.includes(strippedWord)) {
        return `<span class="type-keyword">${word}</span>`;
    }

    if (/^"(?:\\.|[^"\\])*"$/.test(word)) {
        return `<span class="text-literal">${word}</span>`;
    }

    if (/^'(?:\\.|[^'\\])'$/.test(word)) {
        return `<span class="text-literal">${word}</span>`;
    }

    if (/\b0[xX][0-9a-fA-F]+\b/.test(word)) {
        return `<span class="numerical-literal">${word}</span>`;
    }

    if (/\b0[bB][01]+\b/.test(word)) {
        return `<span class="numerical-literal">${word}</span>`;
    }

    if (/\b\d+(\.\d+)?\b/.test(word)) {
        return `<span class="numerical-literal">${word}</span>`;
    }

    if (/\w+\s*\($/.test(word)) {
        const functionName = word.match(/(\w+)\s*\(/)[1];
        return `<span class="function-name">${functionName}</span><span class="operator">(</span>`;
    }

    if (/^\/\/[^\n]*$/.test(word)) {
        return `<span class="comment">${word}</span>`;
    }

    if (/^#include\s*<[^>]+>$/.test(word) || /^#include\s*"[^"]+"$/.test(word)) {
        const includeParts = word.match(/(#include)\s*(<[^>]+>|"[^"]+")/);
        if (includeParts) {
            const keyword = includeParts[1];
            const path = includeParts[2].replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return `<span class="include-keyword">${keyword}</span> <span class="include-path">${path}</span>`;
        }
    }

    if(customTypeNames.includes(strippedWord)) {
        return `<span class="custom-type">${word}</span>`;
    }

    // C++ operators
    const operators = [
        '{', '}', '(', ')', '+', '-', '*', '/', '%', '++', '--', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '&', '|', '^', '~', '<<', '>>', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '->', '.', '->*', '.*', '::'
    ];

    if (operators.includes(word)) {
        return `<span class="operator">${word}</span>`;
    }

    if(word == "<") {
        return `<span class="operator">&lt;</span>`;
    }
    else if(word == ">") {
        return `<span class="operator">&gt;</span>`;
    }

    return word;
});

parent.innerHTML = `<pre class="code">${replacedWords.join('')}</pre>`;

}

function main() {
    generate_code_block(code_1, "code-1");
    generate_code_block(code_2, "code-2");
}

main();