

# Lorem ipsum dolor sit amet
consectetur adipiscing elit. Vivamus hendrerit hendrerit facilisis. Quisque et aliquam tortor, in condimentum orci. Vestibulum ultricies lectus sem, pulvinar porttitor erat ultricies nec. Vivamus tellus magna, pellentesque nec sem in, maximus ornare lectus. Cras sapien enim, tincidunt at dolor nec, ultricies gravida orci. Donec at imperdiet enim, at convallis ipsum. Duis at rutrum nibh.

In id lorem suscipit, scelerisque velit in, tempus odio. Vivamus quis metus rutrum, aliquam mi ut, congue mi. Sed interdum nibh orci, in auctor turpis elementum vitae. Cras urna velit, posuere eu feugiat pharetra, fermentum et nunc. Nulla fringilla porta lectus ac laoreet. Phasellus semper ligula ut dolor aliquam pretium. Vivamus mauris turpis, condimentum ac gravida non, lobortis quis risus. Proin eget ipsum ut mi tempor pharetra nec vel nunc. Proin quis elit arcu. Mauris nec ex magna. Duis sed tempor erat. Etiam euismod placerat imperdiet. Nunc at consequat augue. Nullam et mattis lorem.

Mauris fermentum nunc eu diam laoreet vestibulum eget in nisi. Vivamus rutrum, velit nec faucibus porta, est ante auctor leo, sit amet tincidunt diam lorem sit amet. 

```
#include <iostream>
#include <string>
#include <boost/lexical_cast.hpp>

void Run( const std::string& v, int tgt, int start ) {
    for( ; tgt >= 2 * start + 1; ++start )
        Run( v + ' ' + boost::lexical_cast<std::string>( start ), tgt - start, start + 1 );
    std::cout << v << ' ' << tgt << std::endl;
}

int main() {
    Run( std::string(), 10, 1 );
    getchar();
}
```


```
#include <iostream>
#include <string>
#include <boost/lexical_cast.hpp>

void Run( const std::string& v, int tgt, int start ) {
    for( ; tgt >= 2 * start + 1; ++start )
        Run( v + ' ' + boost::lexical_cast<std::string>( start ), tgt - start, start + 1 );
    std::cout << v << ' ' << tgt << std::endl;
}

int main() {
    Run( std::string(), 10, 1 );
    getchar();
}
```


```
#include <iostream>
#include <string>
#include <boost/lexical_cast.hpp>

void Run( const std::string& v, int tgt, int start ) {
    for( ; tgt >= 2 * start + 1; ++start )
        Run( v + ' ' + boost::lexical_cast<std::string>( start ), tgt - start, start + 1 );
    std::cout << v << ' ' << tgt << std::endl;
}

int main() {
    Run( std::string(), 10, 1 );
    getchar();
}
```
pharetra, fermentum et nunc. Nulla fringilla porta lectus ac laoreet. Phasellus semper ligula ut dolor aliquam pretium. Vivamus mauris turpis, condimentum ac gravida non, lobortis quis risus. Proin eget ipsum ut mi tempor pharetra nec vel nunc. Proin quis elit arcu. Mauris nec ex magna. Duis sed tempor erat. Etiam euismod placerat imperdiet. Nunc at consequat augue. Nullam et mattis lorem.

Mauris fermentum nunc eu diam laoreet vestibulum eget in nisi. Vivamus rutrum, velit nec faucibus porta, est ante auctor leo, sit amet tincidunt diam lorem sit amet. 


```
#include <iostream>
#include <string>
#include <boost/lexical_cast.hpp>

void Run( const std::string& v, int tgt, int start ) {
    for( ; tgt >= 2 * start + 1; ++start )
        Run( v + ' ' + boost::lexical_cast<std::string>( start ), tgt - start, start + 1 );
    std::cout << v << ' ' << tgt << std::endl;
}

int main() {
    Run( std::string(), 10, 1 );
    getchar();
}
```